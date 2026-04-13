/**
 * GET /api/v1/communications
 * Returns system announcements and notifications
 */

interface Communication {
  id: string;
  type: 'announcement' | 'alert' | 'maintenance' | 'feature';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  active: boolean;
  startDate?: string;
  endDate?: string;
}

interface CommunicationsResponse {
  success: boolean;
  data: {
    communications: Communication[];
  };
}

export async function GET(): Promise<Response> {
  try {
    const response: CommunicationsResponse = {
      success: true,
      data: {
        communications: [
          {
            id: 'welcome',
            type: 'announcement',
            title: 'Welcome to Video Downloader',
            message: 'Download videos from TikTok, Instagram, Facebook, and more',
            severity: 'info',
            active: true,
          },
        ],
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Communications API error:', error);

    const response: CommunicationsResponse = {
      success: true,
      data: {
        communications: [],
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
