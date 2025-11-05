import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimeBlock {
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  activity: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');

    if (!apiKey || !spreadsheetId) {
      throw new Error('Missing API key or spreadsheet ID');
    }

    const { action, data } = await req.json();

    if (action === 'upload') {
      // Upload data to Google Sheets
      const timeBlocks = data as TimeBlock[];
      
      // Prepare rows for Google Sheets
      const rows = timeBlocks.map((block: TimeBlock) => {
        const duration = calculateDuration(block.startTime, block.endTime);
        return [
          block.date,
          block.startTime,
          block.endTime,
          block.category,
          block.activity,
          duration.toFixed(2)
        ];
      });

      // Clear existing data (except header)
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:F:clear?key=${apiKey}`;
      await fetch(clearUrl, { method: 'POST' });

      // Append new data
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:append?valueInputOption=RAW&key=${apiKey}`;
      const response = await fetch(appendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: rows
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Google Sheets API error:', error);
        throw new Error(`Failed to upload to Google Sheets: ${error}`);
      }

      return new Response(
        JSON.stringify({ success: true, rowsAdded: rows.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'download') {
      // Download data from Google Sheets
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:F?key=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.text();
        console.error('Google Sheets API error:', error);
        throw new Error(`Failed to fetch from Google Sheets: ${error}`);
      }

      const result = await response.json();
      const rows = result.values || [];

      // Convert rows back to TimeBlock format
      const timeBlocks = rows.map((row: string[]) => ({
        date: row[0] || '',
        startTime: row[1] || '',
        endTime: row[2] || '',
        category: row[3] || '',
        activity: row[4] || ''
      }));

      return new Response(
        JSON.stringify({ success: true, data: timeBlocks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Invalid action. Use "upload" or "download"');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in sync-google-sheets:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return (endMinutes - startMinutes) / 60;
}
