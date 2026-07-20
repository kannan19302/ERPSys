import type React from 'react';
import {
  Activity, AlertTriangle, Award, BarChart3, Bell, BookOpen, Bot, Box, Brain, Briefcase,
  Building, Building2, Calculator, Calendar, CalendarDays, CheckSquare, ClipboardCheck,
  ClipboardList, Clock, Cloud, Code2, Coffee, Cpu, CreditCard, Database, DollarSign,
  Download, Eye, Factory, FileCode2, FileSliders, FileText, FolderOpen, GitBranch, GitFork,
  Globe, GraduationCap, Hammer, HardDrive, HelpCircle, History, Home, Image, Inbox, Key,
  Layers, LayoutDashboard, LayoutGrid, Link, Lock, Mail, MapPin, MessageSquare, Monitor,
  Network, Package, Percent, Phone, PieChart, Play, Puzzle, QrCode, Receipt, RefreshCw,
  RotateCcw, Scale, Server, Settings, Shield, ShieldAlert, ShieldCheck, ShoppingCart,
  Smartphone, Smile, Star, Store, Target, Tractor, Trash2, TrendingUp, Truck,
  UserIcon, UserMinus, UserPlus, Users, Video, Wallet, Warehouse, Webhook, Workflow,
  Wrench, Zap,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>> = {
  Activity, AlertTriangle, Award, BarChart3, Bell, BookOpen, Bot, Box, Brain, Briefcase,
  Building, Building2, Calculator, Calendar, CalendarDays, CheckSquare, ClipboardCheck,
  ClipboardList, Clock, Cloud, Code2, Coffee, Cpu, CreditCard, Database, DollarSign,
  Download, Eye, Factory, FileCode2, FileSliders, FileText, FolderOpen, GitBranch, GitFork,
  Globe, GraduationCap, Hammer, HardDrive, HelpCircle, History, Home, Image, Inbox, Key,
  Layers, LayoutDashboard, LayoutGrid, Link, Lock, Mail, MapPin, MessageSquare, Monitor,
  Network, Package, Percent, Phone, PieChart, Play, Puzzle, QrCode, Receipt, RefreshCw,
  RotateCcw, Scale, Server, Settings, Shield, ShieldAlert, ShieldCheck, ShoppingCart,
  Smartphone, Smile, Star, Store, Target, Tractor, Trash2, TrendingUp, Truck,
  UserIcon, UserMinus, UserPlus, Users, Video, Wallet, Warehouse, Webhook, Workflow,
  Wrench, Zap,
};

export function resolveIcon(name?: string): React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }> {
  return (name && ICON_MAP[name]) || Package;
}
