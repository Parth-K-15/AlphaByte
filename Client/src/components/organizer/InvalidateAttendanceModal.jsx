import { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { invalidateAttendance } from '../../services/organizerApi';

const InvalidateAttendanceModal = ({ isOpen, onClose, attendance, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    if (!isOpen || !attendance) return null;

    const handleSubmit = async () => {
        if (reason.trim().length < 10) {
            setError('Reason must be at least 10 characters');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const organizerId = localStorage.getItem('userId');
            await invalidateAttendance(attendance._id, reason.trim(), organizerId);

            // Success
            onSuccess?.();
            handleClose();
        } catch (err) {
            setError(err.message || 'Failed to invalidate attendance');
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
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Invalidate Attendance Record
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This action will mark the attendance as invalid
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
                    {/* Attendance Details */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Attendance Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Participant:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {attendance.participant?.name || 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {attendance.participant?.email || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Event:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {attendance.event?.title || 'Unknown Event'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Scanned At:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {attendance.scannedAt ? new Date(attendance.scannedAt).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <p className="font-medium text-gray-900 dark:text-white mt-1">
                                    {attendance.status || 'PRESENT'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-medium mb-1">Important:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>This will mark the attendance record as invalid</li>
                                    <li>The original record will be preserved for audit purposes</li>
                                    <li>This action will be logged with your user information</li>
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
                                    Reason for Invalidation <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g., Proxy attendance detected by security camera review"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none ${error && !isValid ? 'border-red-500' : 'border-gray-300'
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
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                    <p className="font-medium mb-2">Please confirm:</p>
                                    <p className="mb-2">You are about to invalidate this attendance record with the following reason:</p>
                                    <div className="bg-white dark:bg-gray-800 rounded p-3 italic border border-blue-200 dark:border-blue-700">
                                        "{reason.trim()}"
                                    </div>
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
                            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Invalidating...
                                </>
                            ) : (
                                'Confirm Invalidation'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvalidateAttendanceModal;
