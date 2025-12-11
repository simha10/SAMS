import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bell, Calendar } from 'lucide-react';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { format } from 'date-fns';

export default function Announcements() {
  const { announcements, loading, error, refetch } = useAnnouncements();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Announcements
          </CardTitle>
          <CardDescription>Loading announcements...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse">Loading announcements...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-destructive">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
          <div className="text-center">
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Announcements
        </CardTitle>
        <CardDescription>
          {announcements.length > 0
            ? `Showing ${announcements.length} active announcement${
                announcements.length > 1 ? 's' : ''
              }`
            : 'No active announcements'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto opacity-50" />
            <p className="mt-2">No announcements at this time</p>
            <p className="text-sm">Check back later for updates</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement._id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {announcement.heading}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                      <span className="mx-2">•</span>
                      <span>{announcement.createdBy.name}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(announcement._id)}
                  >
                    {expandedId === announcement._id ? 'Show Less' : 'Read More'}
                  </Button>
                </div>
                <div
                  className={`mt-3 text-muted-foreground ${
                    expandedId === announcement._id
                      ? ''
                      : 'line-clamp-2'
                  }`}
                >
                  {announcement.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}