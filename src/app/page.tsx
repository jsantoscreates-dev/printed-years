import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

const Gallery = dynamicImport(() => import('@/components/Gallery').then(mod => mod.Gallery), {
  ssr: false,
});

export default function Home() {
  return <Gallery />;
}
