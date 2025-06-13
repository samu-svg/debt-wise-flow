
interface StatusBadgeProps {
  status: 'active' | 'overdue' | 'paid' | 'connected' | 'disconnected';
  children: React.ReactNode;
}

const StatusBadge = ({ status, children }: StatusBadgeProps) => {
  const statusClasses = {
    active: 'bg-blue-50 text-blue-700 border border-blue-200',
    overdue: 'bg-red-50 text-red-700 border border-red-200',
    paid: 'bg-green-50 text-green-700 border border-green-200',
    connected: 'bg-green-50 text-green-700 border border-green-200',
    disconnected: 'bg-gray-50 text-gray-700 border border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
      {children}
    </span>
  );
};

export default StatusBadge;
