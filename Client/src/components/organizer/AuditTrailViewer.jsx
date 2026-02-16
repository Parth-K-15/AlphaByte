import { useState, useEffect } from 'react';
import { X, Clock, User, FileText, AlertCircle, ChevronRight, History } from 'lucide-react';
import { getAuditTrail } from '../../services/organizerApi';

const AuditTrailViewer = ({ isOpen, onClose, entityType, entityId, eventId }) => {
    const [auditData, setAuditData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        if (isOpen && entityType && entityId) {
            fetchAuditTrail();
        }
    }, [isOpen, entityType, entityId]);

    const fetchAuditTrail = async () => {
        setIsLoading(true);
        setError('');

        try {
            const { data } = await getAuditTrail(entityType, entityId);
            setAuditData(data.data);
        } catch (err) {
            setError(err.message || 'Failed to fetch audit trail');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setAuditData(null);
        setSelectedLog(null);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            case 'WARNING':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            case 'INFO':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800';
        }
    };

    const renderStateComparison = (oldState, newState) => {
        if (!oldState && !newState) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {/* Old State */}
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Old State
                    </h5>
                    <pre className="text-xs text-red-900 dark:text-red-300 whitespace-pre-wrap font-mono">
                        {JSON.stringify(oldState, null, 2)}
                    </pre>
                </div>

                {/* New State */}
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        New State
                    </h5>
                    <pre className="text-xs text-green-900 dark:text-green-300 whitespace-pre-wrap font-mono">
                        {JSON.stringify(newState, null, 2)}
                    </pre>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Audit Trail
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Complete change history for {entityType}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading audit trail...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-800 dark:text-red-200">Error Loading Audit Trail</p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                            </div>
                        </div>
                    ) : !auditData ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No audit data available
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Current State */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                                    Current State
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <span className="text-blue-700 dark:text-blue-400">Version:</span>
                                        <p className="font-medium text-blue-900 dark:text-blue-200">
                                            v{auditData.current.version || 1}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-blue-700 dark:text-blue-400">Valid:</span>
                                        <p className="font-medium text-blue-900 dark:text-blue-200">
                                            {auditData.current.isValid ? (
                                                <span className="text-green-600 dark:text-green-400">✓ Yes</span>
                                            ) : (
                                                <span className="text-red-600 dark:text-red-400">✗ No (Invalidated)</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-blue-700 dark:text-blue-400">Total Versions:</span>
                                        <p className="font-medium text-blue-900 dark:text-blue-200">
                                            {auditData.totalVersions}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Change History ({auditData.logs.length} events)
                                </h3>

                                {auditData.logs.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No changes recorded yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {auditData.logs.map((log, index) => (
                                            <div
                                                key={log._id}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() => setSelectedLog(selectedLog?._id === log._id ? null : log)}
                                            >
                                                {/* Log Header */}
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                                                                {log.severity}
                                                            </span>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {log.actionType.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                                            {log.action}
                                                        </p>
                                                        {log.details && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                {log.details}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ChevronRight
                                                        className={`w-5 h-5 text-gray-400 transition-transform ${selectedLog?._id === log._id ? 'rotate-90' : ''
                                                            }`}
                                                    />
                                                </div>

                                                {/* Actor & Time */}
                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        <span>{log.actorName || 'Unknown'}</span>
                                                        <span className="text-gray-400">({log.actorType})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{formatDate(log.createdAt)}</span>
                                                    </div>
                                                </div>

                                                {/* Reason (if exists) */}
                                                {log.reason && (
                                                    <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                                                        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                                                            📝 Reason:
                                                        </p>
                                                        <p className="text-sm text-yellow-900 dark:text-yellow-200 italic">
                                                            "{log.reason}"
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Expanded Details */}
                                                {selectedLog?._id === log._id && (log.oldState || log.newState) && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                                            State Changes:
                                                        </h4>
                                                        {renderStateComparison(log.oldState, log.newState)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Version History */}
                            {auditData.versions && auditData.versions.length > 1 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Version History
                                    </h3>
                                    <div className="space-y-2">
                                        {auditData.versions.map((version, index) => (
                                            <div
                                                key={version._id}
                                                className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            Version {version.version || index + 1}
                                                        </span>
                                                        {index === auditData.versions.length - 1 && (
                                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(version.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditTrailViewer;
