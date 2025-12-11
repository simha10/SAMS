import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Bell, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { announcementAPI } from "@/services/api";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ManagerAnnouncements() {
  const { announcements, loading, error, refetch } = useAnnouncements();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    heading: "",
    description: ""
  });

  const handleCreate = async () => {
    try {
      await announcementAPI.createAnnouncement(formData);
      toast.success("Announcement created successfully");
      setIsCreating(false);
      setFormData({ heading: "", description: "" });
      refetch();
    } catch (err) {
      console.error("Failed to create announcement:", err);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await announcementAPI.updateAnnouncement(id, formData);
      toast.success("Announcement updated successfully");
      setEditingId(null);
      setFormData({ heading: "", description: "" });
      refetch();
    } catch (err) {
      console.error("Failed to update announcement:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    
    try {
      await announcementAPI.deleteAnnouncement(id);
      toast.success("Announcement deleted successfully");
      refetch();
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      toast.error("Failed to delete announcement");
    }
  };

  const startEdit = (id: string, heading: string, description: string) => {
    setEditingId(id);
    setFormData({ heading, description });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ heading: "", description: "" });
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setFormData({ heading: "", description: "" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            Manage announcements for all employees
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-pulse">Loading announcements...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            Manage announcements for all employees
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8 text-destructive">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground">
          Manage announcements for all employees
        </p>
      </div>

      {/* Create Announcement Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Announcement</CardTitle>
            <CardDescription>
              Create a new announcement for all employees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="heading" className="text-sm font-medium">
                Heading
              </label>
              <Input
                id="heading"
                value={formData.heading}
                onChange={(e) => setFormData({...formData, heading: e.target.value})}
                placeholder="Enter announcement heading"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.heading.length}/200 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter announcement description"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={cancelCreate}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!formData.heading.trim() || !formData.description.trim()}
              >
                Create Announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {!isCreating && (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>
        </div>
      )}

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Announcements</CardTitle>
          <CardDescription>
            {announcements.length > 0
              ? `Showing ${announcements.length} active announcement${announcements.length > 1 ? 's' : ''}`
              : 'No active announcements'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto opacity-50" />
              <p className="mt-2">No announcements at this time</p>
              <p className="text-sm">Create your first announcement to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="border rounded-lg p-4"
                >
                  {editingId === announcement._id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor={`heading-${announcement._id}`} className="text-sm font-medium">
                          Heading
                        </label>
                        <Input
                          id={`heading-${announcement._id}`}
                          value={formData.heading}
                          onChange={(e) => setFormData({...formData, heading: e.target.value})}
                          placeholder="Enter announcement heading"
                          maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.heading.length}/200 characters
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor={`description-${announcement._id}`} className="text-sm font-medium">
                          Description
                        </label>
                        <Textarea
                          id={`description-${announcement._id}`}
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Enter announcement description"
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleUpdate(announcement._id)}
                          disabled={!formData.heading.trim() || !formData.description.trim()}
                        >
                          Update Announcement
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">
                            {announcement.heading}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                            <span className="mx-2">•</span>
                            <span>{announcement.createdBy.name}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(
                              announcement._id, 
                              announcement.heading, 
                              announcement.description
                            )}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(announcement._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 text-muted-foreground">
                        {announcement.description}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}