import { NextResponse } from 'next/server';
import { withPublicApi } from '@/lib/api-route';
import { regionalProviders, searchProviders, type ServiceType } from '@/data/providers';

export async function GET(request: Request) {
  return withPublicApi(async () => {
    const { searchParams } = new URL(request.url);
    const commodity = searchParams.get('commodity') || searchParams.get('crop') || undefined;
    const serviceType = (searchParams.get('serviceType') || searchParams.get('type') || undefined) as ServiceType | undefined;
    const county = (searchParams.get('county') || undefined) as 'Kisii' | 'Nyamira' | undefined;

    let providers = searchProviders({
      commodity,
      serviceType: serviceType === ('all' as any) ? undefined : serviceType,
      county,
    });

    if (!providers || providers.length === 0) {
      providers = regionalProviders;
    }

    return NextResponse.json({
      providers,
      total: providers.length,
      notice: 'Provider directory reflects vetted facilities and verified aggregation centers in Kisii & Nyamira counties.',
    });
  });
}
