import Link from 'next/link';

import styles from './postReference.module.scss';

interface PostReferenceProps {
  title: string;
  actionName: string;
  uid: string;
  textAlignRight?: boolean;
}

export const PostReference = ({ title, actionName, uid, textAlignRight }: PostReferenceProps) => (
  <Link href={`/post/${uid}`}>
    <a className={`${styles.container} ${textAlignRight && styles.alignRight}`}>
      <h4>{title}</h4>
      <p>{actionName}</p>
    </a>
  </Link>
)
