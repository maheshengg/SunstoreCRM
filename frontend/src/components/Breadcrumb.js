import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb = () => {
  const location = useLocation();
  
  // Define breadcrumb mapping
  const breadcrumbMap = {
    '/dashboard': 'Dashboard',
    '/parties': 'Parties',
    '/parties/new': 'Add Party',
    '/items': 'Items',
    '/items/new': 'Add Item',
    '/leads': 'Leads',
    '/leads/new': 'Add Lead',
    '/quotations': 'Quotations',
    '/quotations/new': 'New Quotation',
    '/proforma-invoices': 'Proforma Invoices',
    '/proforma-invoices/new': 'New Proforma Invoice',
    '/soa': 'Sales Order Acknowledgement',
    '/soa/new': 'New Sales Order Acknowledgement',
    '/reports': 'Reports',
    '/settings': 'Settings'
  };
  
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [{ path: '/dashboard', label: 'Dashboard' }];
    
    // Build breadcrumb path
    let currentPath = '';
    pathnames.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Check if it's an edit page (has ID)
      if (index === pathnames.length - 1 && !isNaN(segment) && segment.length > 3) {
        // It's an ID, get the parent module name
        const parentPath = pathnames.slice(0, -1).join('/');
        const moduleName = breadcrumbMap[`/${parentPath}`] || segment;
        breadcrumbs.push({ 
          path: currentPath, 
          label: `Edit ${moduleName.slice(0, -1)}` // Remove 's' from plural
        });
      } else {
        const label = breadcrumbMap[currentPath] || segment;
        breadcrumbs.push({ path: currentPath, label });
      }
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Don't show breadcrumb on dashboard
  if (location.pathname === '/dashboard') {
    return null;
  }
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" data-testid="breadcrumb">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <ChevronRight size={16} className="text-muted-foreground" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium" data-testid={`breadcrumb-current`}>
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              data-testid={`breadcrumb-link-${index}`}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              {index === 0 && <Home size={14} />}
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
