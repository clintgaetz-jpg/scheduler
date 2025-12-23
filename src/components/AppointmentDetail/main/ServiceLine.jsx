import React from 'react';
import { 
  ChevronDown, Wrench, CheckCircle, Clock, Pause, Play,
  Package, AlertTriangle, User, GripVertical
} from 'lucide-react';

const LINE_STATUS = {
  pending: { label: 'Pending', color: 'text-gray-500', bg: 'bg-gray-100', icon: Clock, border: 'border-gray-200' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100', icon: Play, border: 'border-blue-200' },
  done: { label: 'Done', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, border: 'border-green-200' },
  hold: { label: 'Hold', color: 'text-amber-600', bg: 'bg-amber-100', icon: Pause, border: 'border-amber-200' },
};

export default function ServiceLine({ line, index, isWOLine, isExpanded, onToggleExpand, onUpdate, servicePackages }) {
  const normalizedLine = isWOLine ? {
    title: line.package_title,
    description: line.package_description,
    hours: line.labor?.tech_hours || 0,
    total: line.package_total || 0,
    status: line.labor?.completed ? 'done' : (line.status || 'pending'),
    technician: line.labor?.technician,
    chapter: line.chapter,
    parts: line.parts || [],
    code: line.package_code,
  } : {
    title: line.title,
    description: line.description,
    hours: line.hours || 0,
    total: line.total || 0,
    status: line.status || 'pending',
    technician: line.technician,
    chapter: line.chapter || 'Service',
    parts: line.parts || [],
    code: line.code,
  };

  const statusConfig = LINE_STATUS[normalizedLine.status] || LINE_STATUS.pending;
  const StatusIcon = statusConfig.icon;
  const hasParts = normalizedLine.parts.length > 0;
  co
