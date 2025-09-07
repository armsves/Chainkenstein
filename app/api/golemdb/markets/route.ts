import { NextRequest, NextResponse } from 'next/server';
import { getGolemDBClient, encodeData, decodeData, createStringAnnotations, createNumericAnnotations } from '../../../../lib/golemdb';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const live = searchParams.get('live') === 'true';
    
    const client = await getGolemDBClient();
    
    // Query markets from GolemDB - fix boolean syntax
    const query = live ? 'type = "market" && isResolved = "false"' : 'type = "market"';
    const results = await client.queryEntities(query);
    
    const markets = results.map((result: any) => {
      const data = decodeData(result.storageValue);
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
        isResolved: data.isResolved || false,
        winner: data.winner,
        createdAt: data.createdAt,
      };
    });
    
    return NextResponse.json({ 
      success: true,
      markets,
      source: 'golemdb',
      count: markets.length
    });
  } catch (error) {
    console.error('Error fetching markets from GolemDB:', error);
    
    // Return empty array instead of mock data
    return NextResponse.json({ 
      success: false,
      markets: [],
      source: 'golemdb',
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, endTime, initialLiquidity, civicGated, creator } = body;
    
    if (!question || !endTime || !initialLiquidity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const client = await getGolemDBClient();
    const id = randomUUID();
    
    // Create market data
    const marketData = {
      id,
      question,
      endTime,
      creator: creator || 'anonymous',
      civicRule: civicGated ? 'kyc-required' : '',
      payoutToken: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      yesShares: (BigInt(initialLiquidity) * BigInt(1e6) / BigInt(2)).toString(),
      noShares: (BigInt(initialLiquidity) * BigInt(1e6) / BigInt(2)).toString(),
      totalLiquidity: (BigInt(initialLiquidity) * BigInt(1e6)).toString(),
      isResolved: false,
      createdAt: Math.floor(Date.now() / 1000),
    };
    
    // Store in GolemDB
    const entity = {
      data: encodeData(marketData),
      btl: 1000, // Increase BTL for longer persistence
      stringAnnotations: createStringAnnotations({
        type: 'market',
        id: marketData.id,
        creator: marketData.creator,
        civicRule: marketData.civicRule,
        isResolved: marketData.isResolved.toString(),
        question: marketData.question.substring(0, 50), // Truncate for annotation
      }),
      numericAnnotations: createNumericAnnotations({
        endTime: marketData.endTime,
        createdAt: marketData.createdAt,
        totalLiquidity: Number(marketData.totalLiquidity),
      })
    };
    
    const receipts = await client.createEntities([entity]);
    console.log(`Created market in GolemDB: ${receipts[0].entityKey}`);
    
    return NextResponse.json({ 
      success: true,
      market: marketData,
      entityKey: receipts[0].entityKey
    });
  } catch (error) {
    console.error('Error creating market in GolemDB:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create market' 
      },
      { status: 500 }
    );
  }
}