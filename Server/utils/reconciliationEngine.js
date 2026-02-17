import ParticipationRecord from '../models/ParticipationRecord.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import mongoose from 'mongoose';

/**
 * Participation Reconciliation Intelligence Engine
 * 
 * Core logic for resolving conflicting participation data from multiple sources
 * and producing one authoritative participation status.
 */

class ReconciliationEngine {
  
  /**
   * Trust score definitions for different signal sources
   * Higher score = more reliable
   */
  static TRUST_SCORES = {
    ATTENDANCE_SCANNER: 95,        // Automated QR scanning - highest trust
    CERTIFICATE: 90,                // System-generated certificate
    ATTENDANCE_MANUAL: 70,          // Manual attendance by organizer
    ORGANIZER_OVERRIDE: 85,         // Explicit organizer decision
    REGISTRATION: 50,               // Just registered - lowest trust
    SYSTEM: 80                      // System-automated actions
  };

  /**
   * Canonical status priority (used when multiple valid statuses could apply)
   */
  static STATUS_PRIORITY = {
    CERTIFIED: 4,
    ATTENDED_NO_CERTIFICATE: 3,
    INVALIDATED: 2,
    REGISTERED_ONLY: 1
  };

  /**
   * Reconcile participation for a specific student-event pair
   * @param {String} email - Student email
   * @param {ObjectId} eventId - Event ID
   * @returns {Object} Reconciliation result
   */
  static async reconcileParticipation(email, eventId) {
    try {
      // Step 1: Ingest all signals from different sources
      const signals = await this.ingestAllSignals(email, eventId);
      
      // Step 2: Detect conflicts
      const conflicts = this.detectConflicts(signals);
      
      // Step 3: Apply reconciliation rules
      const canonicalStatus = this.determineCanonicalStatus(signals, conflicts);
      
      // Step 4: Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(signals, conflicts, canonicalStatus);
      
      // Step 5: Determine flags
      const flags = this.determineFlags(signals, conflicts, confidenceScore);
      
      // Step 6: Create status breakdown
      const statusBreakdown = this.createStatusBreakdown(signals);
      
      // Step 7: Find or create ParticipationRecord
      const participant = await Participant.findOne({ email, event: eventId });
      
      let record = await ParticipationRecord.findOne({ email, event: eventId });
      
      if (!record) {
        record = new ParticipationRecord({
          email,
          event: eventId,
          participant: participant?._id || null,
          signals: [],
          canonicalStatus,
          reconciliation: {
            lastReconciledAt: new Date(),
            reconciliationVersion: 1,
            confidenceScore,
            conflicts,
            resolutionStrategy: 'TRUST_SCORE'
          },
          flags,
          statusBreakdown
        });
      } else {
        // Update existing record
        record.reconciliation.reconciliationVersion += 1;
        record.reconciliation.lastReconciledAt = new Date();
        record.reconciliation.confidenceScore = confidenceScore;
        record.reconciliation.conflicts = conflicts;
        record.canonicalStatus = canonicalStatus;
        record.flags = flags;
        record.statusBreakdown = statusBreakdown;
      }
      
      // Step 8: Update or replace signals
      record.signals = signals;
      
      await record.save();
      
      return {
        success: true,
        record,
        reconciliationSummary: {
          canonicalStatus,
          confidenceScore,
          conflictsCount: conflicts.length,
          signalsCount: signals.length,
          requiresManualReview: flags.requiresManualReview
        }
      };
      
    } catch (error) {
      console.error('Reconciliation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ingest all participation signals from different sources
   */
  static async ingestAllSignals(email, eventId) {
    const signals = [];
    
    // Signal 1: Registration data
    const participant = await Participant.findOne({ email, event: eventId, isValid: true });
    if (participant) {
      signals.push({
        source: 'REGISTRATION',
        signalType: 'REGISTERED',
        trustScore: this.TRUST_SCORES.REGISTRATION,
        timestamp: participant.createdAt,
        recordedBy: participant.createdBy,
        sourceRef: {
          model: 'Participant',
          id: participant._id
        },
        metadata: {
          registrationStatus: participant.registrationStatus,
          registrationType: participant.registrationType
        },
        isActive: participant.isValid
      });
    }
    
    // Signal 2: Attendance data
    const attendance = await Attendance.findOne({ 
      participant: participant?._id, 
      event: eventId,
      isValid: true 
    });
    
    if (attendance) {
      const source = attendance.markedBy ? 'ATTENDANCE_MANUAL' : 'ATTENDANCE_SCANNER';
      signals.push({
        source,
        signalType: 'PRESENT',
        trustScore: this.TRUST_SCORES[source],
        timestamp: attendance.scannedAt,
        recordedBy: attendance.markedBy,
        sourceRef: {
          model: 'Attendance',
          id: attendance._id
        },
        metadata: {
          status: attendance.status,
          sessionId: attendance.sessionId
        },
        isActive: attendance.isValid
      });
    } else if (participant && participant.attendanceStatus === 'ABSENT') {
      // Explicit absence record
      signals.push({
        source: 'SYSTEM',
        signalType: 'ABSENT',
        trustScore: this.TRUST_SCORES.SYSTEM,
        timestamp: new Date(),
        recordedBy: null,
        sourceRef: {
          model: 'Participant',
          id: participant._id
        },
        metadata: {
          inferredFrom: 'participantAttendanceStatus'
        },
        isActive: true
      });
    }
    
    // Signal 3: Certificate data
    const certificate = await Certificate.findOne({ 
      participant: participant?._id, 
      event: eventId 
    });
    
    if (certificate) {
      if (certificate.status === 'REVOKED' || !certificate.isValid) {
        signals.push({
          source: 'CERTIFICATE',
          signalType: 'CERTIFICATE_REVOKED',
          trustScore: this.TRUST_SCORES.CERTIFICATE,
          timestamp: certificate.revokedAt || certificate.updatedAt,
          recordedBy: certificate.revokedBy || certificate.issuedBy,
          sourceRef: {
            model: 'Certificate',
            id: certificate._id
          },
          metadata: {
            certificateId: certificate.certificateId,
            revocationReason: certificate.revocationReason
          },
          isActive: true
        });
      } else {
        signals.push({
          source: 'CERTIFICATE',
          signalType: 'CERTIFICATE_ISSUED',
          trustScore: this.TRUST_SCORES.CERTIFICATE,
          timestamp: certificate.issuedAt,
          recordedBy: certificate.issuedBy,
          sourceRef: {
            model: 'Certificate',
            id: certificate._id
          },
          metadata: {
            certificateId: certificate.certificateId,
            status: certificate.status
          },
          isActive: certificate.isValid
        });
      }
    }
    
    // Signal 4: Check for invalidated participant
    if (participant && !participant.isValid) {
      signals.push({
        source: 'ORGANIZER_OVERRIDE',
        signalType: 'INVALIDATED',
        trustScore: this.TRUST_SCORES.ORGANIZER_OVERRIDE,
        timestamp: participant.invalidatedAt,
        recordedBy: participant.invalidatedBy,
        sourceRef: {
          model: 'Participant',
          id: participant._id
        },
        metadata: {
          reason: participant.invalidationReason
        },
        isActive: true
      });
    }
    
    return signals;
  }

  /**
   * Detect conflicts between signals
   */
  static detectConflicts(signals) {
    const conflicts = [];
    const activeSignals = signals.filter(s => s.isActive);
    
    // Conflict 1: Certificate issued without attendance
    const hasCertificate = activeSignals.some(s => s.signalType === 'CERTIFICATE_ISSUED');
    const hasAttendance = activeSignals.some(s => s.signalType === 'PRESENT');
    const hasAbsence = activeSignals.some(s => s.signalType === 'ABSENT');
    
    if (hasCertificate && !hasAttendance) {
      conflicts.push({
        conflictType: 'CERTIFICATE_WITHOUT_ATTENDANCE',
        description: 'Certificate issued but no attendance record found',
        detectedAt: new Date()
      });
    }
    
    // Conflict 2: Both present and absent signals
    if (hasAttendance && hasAbsence) {
      conflicts.push({
        conflictType: 'ATTENDANCE_CONTRADICTION',
        description: 'Conflicting attendance signals (both present and absent)',
        detectedAt: new Date()
      });
    }
    
    // Conflict 3: Certificate revoked but marked as present
    const hasRevokedCert = activeSignals.some(s => s.signalType === 'CERTIFICATE_REVOKED');
    if (hasRevokedCert && hasAttendance) {
      conflicts.push({
        conflictType: 'REVOKED_WITH_ATTENDANCE',
        description: 'Certificate revoked but attendance record exists',
        detectedAt: new Date()
      });
    }
    
    // Conflict 4: Multiple high-trust sources disagreeing
    const highTrustSignals = activeSignals.filter(s => s.trustScore >= 80);
    if (highTrustSignals.length >= 2) {
      const types = [...new Set(highTrustSignals.map(s => s.signalType))];
      if (types.length > 1 && 
          (types.includes('PRESENT') && types.includes('ABSENT') || 
           types.includes('CERTIFICATE_ISSUED') && types.includes('CERTIFICATE_REVOKED'))) {
        conflicts.push({
          conflictType: 'HIGH_TRUST_DISAGREEMENT',
          description: 'Multiple high-trust sources provide conflicting information',
          detectedAt: new Date()
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Determine the canonical status based on signals and conflicts
   */
  static determineCanonicalStatus(signals, conflicts) {
    const activeSignals = signals.filter(s => s.isActive);
    
    // If manually invalidated, that takes precedence
    const hasInvalidation = activeSignals.some(s => s.signalType === 'INVALIDATED');
    if (hasInvalidation) {
      return 'INVALIDATED';
    }
    
    // Get the highest trust signal for each category
    const registrationSignal = this.getHighestTrustSignal(activeSignals, ['REGISTERED']);
    const attendanceSignal = this.getHighestTrustSignal(activeSignals, ['PRESENT', 'ABSENT']);
    const certificateSignal = this.getHighestTrustSignal(activeSignals, ['CERTIFICATE_ISSUED', 'CERTIFICATE_REVOKED']);
    
    const isRegistered = !!registrationSignal;
    const isPresent = attendanceSignal?.signalType === 'PRESENT';
    const hasCertificate = certificateSignal?.signalType === 'CERTIFICATE_ISSUED';
    
    // Decision matrix based on signals
    if (hasCertificate && isPresent) {
      return 'CERTIFIED';
    }
    
    if (hasCertificate && !isPresent) {
      // Suspicious: certificate without attendance
      return 'INVALIDATED';
    }
    
    if (isPresent && !hasCertificate) {
      return 'ATTENDED_NO_CERTIFICATE';
    }
    
    if (isRegistered && !isPresent) {
      return 'REGISTERED_ONLY';
    }
    
    // Default fallback
    return 'REGISTERED_ONLY';
  }

  /**
   * Get the signal with highest trust score from a list
   */
  static getHighestTrustSignal(signals, signalTypes) {
    const filtered = signals.filter(s => signalTypes.includes(s.signalType));
    if (filtered.length === 0) return null;
    
    return filtered.reduce((highest, current) => 
      current.trustScore > highest.trustScore ? current : highest
    );
  }

  /**
   * Calculate confidence score for the reconciliation
   */
  static calculateConfidenceScore(signals, conflicts, canonicalStatus) {
    const activeSignals = signals.filter(s => s.isActive);
    
    if (activeSignals.length === 0) return 0;
    
    // Base score: average trust score of all active signals
    const avgTrustScore = activeSignals.reduce((sum, s) => sum + s.trustScore, 0) / activeSignals.length;
    
    // Penalty for conflicts
    const conflictPenalty = conflicts.length * 15; // -15 points per conflict
    
    // Bonus for consistency
    const consistencyBonus = conflicts.length === 0 ? 10 : 0;
    
    // Penalty for suspicious patterns
    let suspiciousPenalty = 0;
    if (canonicalStatus === 'INVALIDATED') {
      suspiciousPenalty = 20;
    }
    
    const finalScore = Math.max(0, Math.min(100, 
      avgTrustScore + consistencyBonus - conflictPenalty - suspiciousPenalty
    ));
    
    return Math.round(finalScore);
  }

  /**
   * Determine flags based on reconciliation results
   */
  static determineFlags(signals, conflicts, confidenceScore) {
    const activeSignals = signals.filter(s => s.isActive);
    
    const hasConflicts = conflicts.length > 0;
    const requiresManualReview = hasConflicts || confidenceScore < 50;
    
    // Suspicious patterns
    const hasCertificate = activeSignals.some(s => s.signalType === 'CERTIFICATE_ISSUED');
    const hasAttendance = activeSignals.some(s => s.signalType === 'PRESENT');
    const isSuspicious = (hasCertificate && !hasAttendance) || conflicts.length >= 2;
    
    // Verified: high confidence, no conflicts, all signals agree
    const isVerified = confidenceScore >= 80 && !hasConflicts && activeSignals.length >= 2;
    
    return {
      hasConflicts,
      requiresManualReview,
      isSuspicious,
      isVerified
    };
  }

  /**
   * Create status breakdown for quick queries
   */
  static createStatusBreakdown(signals) {
    const activeSignals = signals.filter(s => s.isActive);
    
    return {
      isRegistered: activeSignals.some(s => s.signalType === 'REGISTERED'),
      hasAttendance: activeSignals.some(s => s.signalType === 'PRESENT'),
      hasCertificate: activeSignals.some(s => s.signalType === 'CERTIFICATE_ISSUED'),
      isRevoked: activeSignals.some(s => s.signalType === 'CERTIFICATE_REVOKED' || s.signalType === 'INVALIDATED')
    };
  }

  /**
   * Reconcile all participants for an event
   */
  static async reconcileEvent(eventId) {
    try {
      const participants = await Participant.find({ event: eventId });
      const results = {
        total: participants.length,
        reconciled: 0,
        failed: 0,
        conflicts: 0,
        requiresReview: 0
      };
      
      for (const participant of participants) {
        const result = await this.reconcileParticipation(participant.email, eventId);
        
        if (result.success) {
          results.reconciled++;
          if (result.record.flags.hasConflicts) results.conflicts++;
          if (result.record.flags.requiresManualReview) results.requiresReview++;
        } else {
          results.failed++;
        }
      }
      
      return {
        success: true,
        eventId,
        results
      };
      
    } catch (error) {
      console.error('Event reconciliation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Manual override by authorized user
   */
  static async manualOverride(email, eventId, newStatus, userId, reason) {
    try {
      const record = await ParticipationRecord.findOne({ email, event: eventId });
      
      if (!record) {
        return {
          success: false,
          error: 'Participation record not found'
        };
      }
      
      const previousStatus = record.canonicalStatus;
      
      record.manualOverride = {
        isOverridden: true,
        overriddenBy: userId,
        overriddenAt: new Date(),
        overrideReason: reason,
        previousStatus
      };
      
      record.canonicalStatus = newStatus;
      record.flags.requiresManualReview = false;
      record.reconciliation.resolutionStrategy = 'MANUAL_OVERRIDE';
      record.reconciliation.lastReconciledAt = new Date();
      record.reconciliation.reconciliationVersion += 1;
      
      await record.save();
      
      return {
        success: true,
        record,
        message: `Status manually overridden from ${previousStatus} to ${newStatus}`
      };
      
    } catch (error) {
      console.error('Manual override error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ReconciliationEngine;
