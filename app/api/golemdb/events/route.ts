import { NextRequest, NextResponse } from 'next/server';
import { getGolemDBClient, encodeData, createStringAnnotations, createNumericAnnotations } from '../../../../lib/golemdb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, marketId, user, data, timestamp } = body;
    
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Event type is required' },
        { status: 400 }
      );
    }
    
    const client = await getGolemDBClient();
    
    const event = {
      type,
      marketId: marketId || '',
      user: user || '',
      data: data || {},
      timestamp: timestamp || Date.now(),
    };
    
    const entity = {
      data: encodeData(event),
      btl: 300, // ~10 minutes for demo
      stringAnnotations: createStringAnnotations({
        type: 'event',
        eventType: event.type,
        marketId: event.marketId,
        user: event.user,
      }),
      numericAnnotations: createNumericAnnotations({
        timestamp: event.timestamp,
      })
    };
    
    const receipts = await client.createEntities([entity]);
    console.log(`Wrote event to GolemDB: ${receipts[0].entityKey}`);
    
    return NextResponse.json({ 
      success: true,
      entityKey: receipts[0].entityKey,
      event
    });
  } catch (error) {
    console.error('Error writing event to GolemDB:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to write event' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('type');
    const marketId = searchParams.get('marketId');
    const user = searchParams.get('user');
    
    const client = await getGolemDBClient();
    
    // Build query based on parameters
    let query = 'type = "event"';
    if (eventType) query += ` && eventType = "${eventType}"`;
    if (marketId) query += ` && marketId = "${marketId}"`;
    if (user) query += ` && user = "${user}"`;
    
    const results = await client.queryEntities(query);
    
    const events = results.map((result: any) => {
      return JSON.parse(new TextDecoder().decode(result.storageValue));
    });
    
    return NextResponse.json({ 
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching events from GolemDB:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch events',
        events: []
      },
      { status: 500 }
    );
  }
}