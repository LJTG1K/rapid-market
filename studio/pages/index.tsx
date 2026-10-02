import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({ redirect: { destination: '/brands', permanent: false } });

export default function Home() {
  return null;
}
