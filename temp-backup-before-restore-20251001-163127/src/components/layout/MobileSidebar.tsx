import React from 'react';
import {
  Sheet,
  SheetContent,
} from '../ui/sheet';
import Sidebar from './Sidebar';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileSidebar({ 
  open, 
  onOpenChange
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-80">
        <Sidebar onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
