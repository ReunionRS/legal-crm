import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Filter,
  Gavel,
  History,
  Inbox,
  LogOut,
  Moon,
  Search,
  Settings,
  SortAsc,
  Sun,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'

const iconMap = {
  analytics: BarChart3,
  checkCircle: CheckCircle2,
  chevronRight: ChevronRight,
  dashboard: BarChart3,
  delete: Trash2,
  edit: Edit3,
  filter: Filter,
  gavel: Gavel,
  group: Users,
  groups: Users,
  history: History,
  inbox: Inbox,
  logout: LogOut,
  moon: Moon,
  personAdd: UserPlus,
  search: Search,
  settings: Settings,
  sort: SortAsc,
  sun: Sun,
}

export function AppIcon({ name, className = '', strokeWidth = 2 }) {
  const Icon = iconMap[name]

  if (!Icon) {
    return null
  }

  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />
}
