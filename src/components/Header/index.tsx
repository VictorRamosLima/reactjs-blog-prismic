import Link from 'next/link';

import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.container}>
      <div className={styles.content}>
        <Link href="/">
          <a>
            <img
              className={styles.logoId}
              src="/images/logo.svg"
              alt="logo id"
            />
            <img src="/images/logo_text.svg" alt="logo" />
            <span>.</span>
          </a>
        </Link>
      </div>
    </header>
  );
}
