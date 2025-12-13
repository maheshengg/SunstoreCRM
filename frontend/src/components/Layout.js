import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, Package, FileText, File, FileCheck, FileBarChart, Settings, LogOut, Menu, X, BarChart3, Plus } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/parties', icon: Users, label: 'Parties' },
    { path: '/items', icon: Package, label: 'Items' },
    { path: '/leads', icon: FileText, label: 'Leads' },
    { path: '/quotations', icon: File, label: 'Quotations' },
    { path: '/proforma-invoices', icon: FileCheck, label: 'Proforma' },
    { path: '/soa', icon: FileBarChart, label: 'SOA' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              data-testid="mobile-menu-toggle"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold">
                M
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">Mahesh CRM</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs opacity-80">{user?.role}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="quick-create-btn" variant="secondary" size="sm" className="gap-2">
                  <Plus size={16} />
                  <span className="hidden sm:inline">Quick Create</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="quick-create-lead" onClick={() => navigate('/leads/new')}>
                  <FileText className="mr-2 h-4 w-4" />
                  New Lead
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="quick-create-quotation" onClick={() => navigate('/quotations/new')}>
                  <File className="mr-2 h-4 w-4" />
                  New Quotation
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="quick-create-pi" onClick={() => navigate('/proforma-invoices/new')}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  New PI
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="quick-create-soa" onClick={() => navigate('/soa/new')}>
                  <FileBarChart className="mr-2 h-4 w-4" />
                  New SOA
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              data-testid="logout-btn"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-slate-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {children}
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`bottom-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center justify-center py-3 transition-colors ${
                isActive(item.path)
                  ? 'text-primary'
                  : 'text-slate-600'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};
