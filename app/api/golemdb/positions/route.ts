import { NextRequest, NextResponse } from 'next/server';
import { getGolemDBClient, encodeData, createStringAnnotations, createNumericAnnotations } from '../../../../lib/golemdb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, user, side, amount, shares, chain, txHash } = body;
    
    if (!marketId || !user || !side || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required position fields' },
        { status: 400 }
      );
    }
    
    const client = await getGolemDBClient();
    
    const position = {
      marketId,
      user,
      side,
      amount: amount.toString(),
      shares: shares?.toString() || amount.toString(),
      chain: chain || 'base',
      txHash: txHash || '',
      timestamp: Date.now(),
    };
    
    const entity = {
      data: encodeData(position),
      btl: 300,
      stringAnnotations: createStringAnnotations({
        type: 'position',
        marketId: position.marketId,
        user: position.user,
        side: position.side,
        chain: position.chain,
        txHash: position.txHash,
      }),
      numericAnnotations: createNumericAnnotations({
        amount: Number(position.amount),
        shares: Number(position.shares),
        timestamp: position.timestamp,
      })
    };
    
    const receipts = await client.createEntities([entity]);
    console.log(`Created position in GolemDB: ${receipts[0].entityKey}`);
    
    return NextResponse.json({ 
      success: true,
      position,
      entityKey: receipts[0].entityKey
    });
  } catch (error) {
    console.error('Error creating position in GolemDB:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create position' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');
    const user = searchParams.get('user');
    
    const client = await getGolemDBClient();
    
    let query = 'type = "position"';
    if (marketId) query += ` && marketId = "${marketId}"`;
    if (user) query += ` && user = "${user}"`;
    
    const results = await client.queryEntities(query);
    
    const positions = results.map((result: any) => {
      return JSON.parse(new TextDecoder().decode(result.storageValue));
    });
    
    return NextResponse.json({ 
      success: true,
      positions,
      count: positions.length
    });
  } catch (error) {
    console.error('Error fetching positions from GolemDB:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch positions',
        positions: []
      },
      { status: 500 }
    );
  }
}