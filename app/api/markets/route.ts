import { NextRequest, NextResponse } from 'next/server';
import { getGolemDBClient, encodeData, createStringAnnotations, createNumericAnnotations } from '../../../lib/golemdb';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const live = searchParams.get('live') === 'true';
    
    const client = await getGolemDBClient();
    const dbKey = process.env.GOLEM_DB_KEY;
    
    // Query markets from GolemDB - fix boolean syntax and add database key filter
    const query = live 
      ? `type = "market" && databaseKey = "${dbKey}" && isResolved = "false"` 
      : `type = "market" && databaseKey = "${dbKey}"`;
    
    console.log('Executing query:', query);
    const results = await client.queryEntities(query);
    
    const markets = results.map((result: any) => {
      // Use TextDecoder directly since decodeData doesn't exist
      const data = JSON.parse(new TextDecoder().decode(result.storageValue));
      return {
        id: data.id,
        question: data.question,
        endTime: data.endTime,
        creator: data.creator,
        civicRule: data.civicRule || '',
        payoutToken: data.payoutToken,
        yesShares: data.yesShares.toString(),
        noShares: data.noShares.toString(),
        totalLiquidity: data.totalLiquidity.toString(),
        isResolved: data.isResolved === 'true' || data.isResolved === true,
        winner: data.winner,
        createdAt: data.createdAt,
      };
    });
    
    return NextResponse.json({ markets });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, endTime, initialLiquidity, civicGated } = body;
    
    if (!question || !endTime || !initialLiquidity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const client = await getGolemDBClient();
    const id = randomUUID();
    const dbKey = process.env.GOLEM_DB_KEY;
    
    // Create market data
    const marketData = {
      id,
      question,
      endTime,
      creator: '0x...', // Should come from authenticated user
      civicRule: civicGated ? 'kyc-required' : '',
      payoutToken: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      yesShares: (BigInt(initialLiquidity) * BigInt(1e6) / BigInt(2)).toString(),
      noShares: (BigInt(initialLiquidity) * BigInt(1e6) / BigInt(2)).toString(),
      totalLiquidity: (BigInt(initialLiquidity) * BigInt(1e6)).toString(),
      isResolved: false,
      createdAt: Math.floor(Date.now() / 1000),
      databaseKey: dbKey
    };
    
    // Store in GolemDB - store boolean as string
    const entity = {
      data: encodeData(marketData),
      btl: 86400, // 1 day
      stringAnnotations: createStringAnnotations({
        type: 'market',
        id: marketData.id,
        creator: marketData.creator,
        civicRule: marketData.civicRule,
        isResolved: marketData.isResolved.toString(), // Store as string
        databaseKey: dbKey || '',
      }),
      numericAnnotations: createNumericAnnotations({
        endTime: marketData.endTime,
        createdAt: marketData.createdAt,
      })
    };
    
    const receipts = await client.createEntities([entity]);
    console.log(`Created market in GolemDB: ${receipts[0].entityKey}`);
    
    return NextResponse.json({ market: marketData });
  } catch (error) {
    console.error('Error creating market:', error);
    return NextResponse.json(
      { error: 'Failed to create market' },
      { status: 500 }
    );
  }
}