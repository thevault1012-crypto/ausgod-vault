
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import App from '../vault-app'

export default function Index() {
  const router = useRouter();
  return <App path={router.asPath} />;
}
