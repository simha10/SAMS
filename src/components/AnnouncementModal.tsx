import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { Announcement } from "../types";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  announcement,
}: AnnouncementModalProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleView = () => {
    onClose();
    navigate("/employee/announcements");
  };

  if (!announcement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2 text-primary" />
            🎉 Hurray! Updates Here
          </DialogTitle>
          <DialogDescription>
            New announcement from management
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{announcement.heading}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
              <span className="mx-2">•</span>
              <span>{announcement.createdBy.name}</span>
            </div>
          </div>
          
          <div className={`text-muted-foreground ${expanded ? '' : 'line-clamp-3'}`}>
            {announcement.description}
          </div>
          
          {announcement.description.length > 100 && (
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : 'Read More'}
            </Button>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleView}>
            View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}