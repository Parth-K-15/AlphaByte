import ReconciliationEngine from '../utils/reconciliationEngine.js';

/**
 * Reconciliation Middleware
 * 
 * Automatically triggers reconciliation when participation data changes.
 * Can be used as Mongoose middleware or called directly.
 */

/**
 * Trigger reconciliation for a participant
 * Call this after any operation that affects participation status
 */
export const triggerReconciliation = async (email, eventId) => {
  try {
    // Run reconciliation in background (don't wait for it)
    setImmediate(async () => {
      try {
        await ReconciliationEngine.reconcileParticipation(email, eventId);
        console.log(`✅ Auto-reconciled: ${email} for event ${eventId}`);
      } catch (error) {
        console.error(`❌ Auto-reconciliation failed for ${email}:`, error.message);
      }
    });
  } catch (error) {
    console.error('Trigger reconciliation error:', error);
  }
};

/**
 * Trigger reconciliation for multiple participants
 */
export const triggerBatchReconciliation = async (participants) => {
  try {
    setImmediate(async () => {
      for (const { email, eventId } of participants) {
        try {
          await ReconciliationEngine.reconcileParticipation(email, eventId);
        } catch (error) {
          console.error(`❌ Batch reconciliation failed for ${email}:`, error.message);
        }
      }
      console.log(`✅ Batch reconciliation completed for ${participants.length} participants`);
    });
  } catch (error) {
    console.error('Trigger batch reconciliation error:', error);
  }
};

/**
 * Trigger event-wide reconciliation
 */
export const triggerEventReconciliation = async (eventId) => {
  try {
    setImmediate(async () => {
      try {
        await ReconciliationEngine.reconcileEvent(eventId);
        console.log(`✅ Event-wide reconciliation completed for event ${eventId}`);
      } catch (error) {
        console.error(`❌ Event reconciliation failed for ${eventId}:`, error.message);
      }
    });
  } catch (error) {
    console.error('Trigger event reconciliation error:', error);
  }
};

/**
 * Express middleware to auto-reconcile after response
 * Add this to routes that modify participation data
 * 
 * Usage in routes:
 * router.post('/mark-attendance', autoReconcileMiddleware, async (req, res) => {
 *   // ... mark attendance
 *   req.reconcile = { email: 'student@email.com', eventId: '...' };
 *   res.json({ success: true });
 * });
 */
export const autoReconcileMiddleware = (req, res, next) => {
  // Save original send function
  const originalSend = res.send;
  
  // Override send function
  res.send = function(data) {
    // Call original send
    originalSend.call(this, data);
    
    // Trigger reconciliation after response is sent
    if (req.reconcile) {
      if (Array.isArray(req.reconcile)) {
        triggerBatchReconciliation(req.reconcile);
      } else {
        const { email, eventId } = req.reconcile;
        if (email && eventId) {
          triggerReconciliation(email, eventId);
        }
      }
    }
  };
  
  next();
};

/**
 * Mongoose post-save middleware for Participant model
 * Add this to the Participant model to auto-trigger reconciliation
 */
export const participantReconciliationHook = async function(doc) {
  if (doc.email && doc.event) {
    await triggerReconciliation(doc.email, doc.event);
  }
};

/**
 * Mongoose post-save middleware for Attendance model
 */
export const attendanceReconciliationHook = async function(doc) {
  // Need to populate participant to get email
  await doc.populate('participant');
  if (doc.participant?.email && doc.event) {
    await triggerReconciliation(doc.participant.email, doc.event);
  }
};

/**
 * Mongoose post-save middleware for Certificate model
 */
export const certificateReconciliationHook = async function(doc) {
  // Need to populate participant to get email
  await doc.populate('participant');
  if (doc.participant?.email && doc.event) {
    await triggerReconciliation(doc.participant.email, doc.event);
  }
};

/**
 * Helper: Add reconciliation hooks to a model
 * 
 * Usage:
 * import { addReconciliationHooks } from '../middleware/reconciliation.js';
 * addReconciliationHooks(participantSchema, 'participant');
 */
export const addReconciliationHooks = (schema, modelType) => {
  const hooks = {
    participant: participantReconciliationHook,
    attendance: attendanceReconciliationHook,
    certificate: certificateReconciliationHook
  };
  
  const hook = hooks[modelType.toLowerCase()];
  
  if (hook) {
    // Trigger on save
    schema.post('save', hook);
    
    // Trigger on findOneAndUpdate
    schema.post('findOneAndUpdate', async function(doc) {
      if (doc) {
        await hook.call(this, doc);
      }
    });
    
    // Trigger on update
    schema.post('updateOne', async function(result) {
      if (result.acknowledged) {
        const doc = await this.model.findOne(this.getQuery());
        if (doc) {
          await hook.call(this, doc);
        }
      }
    });
  }
};

export default {
  triggerReconciliation,
  triggerBatchReconciliation,
  triggerEventReconciliation,
  autoReconcileMiddleware,
  addReconciliationHooks,
  participantReconciliationHook,
  attendanceReconciliationHook,
  certificateReconciliationHook
};
