import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { revokeCertificate } from '../../services/organizerApi';

const RevokeCertificateModal = ({ isOpen, onClose, certificate, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    if (!isOpen || !certificate) return null;

    const handleSubmit = async () => {
        if (reason.trim().length < 10) {
            setError('Reason must be at least 10 characters');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const organizerId = localStorage.getItem('userId');
            await revokeCertificate(certificate._id, reason.trim(), organizerId);

            // Success
            onSuccess?.();
            handleClose();
        } catch (err) {
            setError(err.message || 'Failed to revoke certificate');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setReason('');
        setError('');
        setShowConfirmation(false);
        onClose();
    };

    const characterCount = reason.trim().length;
    const isValid = characterCount >= 10;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Revoke Certificate
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This action will permanently revoke the certificate
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={isLoading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Certificate Details */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Certificate Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Certificate ID:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1 font-mono">
                                    {certificate.certificateId || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${certificate.status === 'SENT' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            certificate.status === 'GENERATED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                        }`}>
                                        {certificate.status}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Participant:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {certificate.participant?.name || 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {certificate.participant?.email || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Event:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {certificate.event?.title || 'Unknown Event'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Issued At:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Critical Warning */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-800 dark:text-red-200">
                                <p className="font-medium mb-1">⚠️ Critical Action - Read Carefully:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>This will <strong>permanently revoke</strong> the certificate</li>
                                    <li>The certificate will be marked as <strong>INVALID</strong> in verification systems</li>
                                    <li>The participant's certificate status will be reset to PENDING</li>
                                    <li>The original certificate data will be preserved for audit purposes</li>
                                    <li>This action will be logged with CRITICAL severity</li>
                                    <li>A mandatory reason must be provided (minimum 10 characters)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {!showConfirmation ? (
                        <>
                            {/* Reason Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reason for Revocation <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g., Certificate issued to wrong participant due to data entry error"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none ${error && !isValid ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    rows={4}
                                    disabled={isLoading}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <span className={`text-sm ${characterCount < 10 ? 'text-red-500' : 'text-green-600 dark:text-green-400'
                                        }`}>
                                        {characterCount < 10 ? `${10 - characterCount} more characters needed` : '✓ Valid reason'}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {characterCount} / 500
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                                    {error}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Confirmation Step */
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
                            <div className="flex gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-red-800 dark:text-red-200">
                                    <p className="font-bold mb-2">⚠️ FINAL CONFIRMATION REQUIRED</p>
                                    <p className="mb-2">You are about to <strong>REVOKE</strong> certificate <code className="bg-red-100 dark:bg-red-900/40 px-1 py-0.5 rounded">{certificate.certificateId}</code> with the following reason:</p>
                                    <div className="bg-white dark:bg-gray-800 rounded p-3 italic border border-red-200 dark:border-red-700 mb-2">
                                        "{reason.trim()}"
                                    </div>
                                    <p className="font-medium">This action cannot be undone. Are you absolutely sure?</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    {!showConfirmation ? (
                        <button
                            onClick={() => setShowConfirmation(true)}
                            disabled={!isValid || isLoading}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Confirmation
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Revoking Certificate...
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="w-4 h-4" />
                                    Yes, Revoke Certificate
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RevokeCertificateModal;
