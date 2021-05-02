import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { formatDate } from '../utils/formatDate';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string | null;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

const toPosts = post => ({
  uid: post.uid,
  first_publication_date: formatDate(post.first_publication_date),
  data: {
    title: RichText.asText(post.data.title),
    subtitle: post.data.subtitle,
    author: post.data.author,
  },
})

export default function Home({
  postsPagination: { results, next_page },
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([...results]);
  const [nextPage, setNextPage] = useState<string>(next_page);

  async function handleFetchPosts(): Promise<void> {
    if (nextPage) {
      fetch(nextPage)
        .then(rawResponse => rawResponse.json())
        .then(response => {
          const fetchedPosts = response.results.map(toPosts);

          setNextPage(response.next_page);
          setPosts([...posts, ...fetchedPosts]);
        });
    }
  }

  return (
    <>
      <Head>
        <title>Posts | spacetraveling</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <div className={styles.bodyWrapper}>
          <div className={styles.posts}>
            {posts.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <h2 className={commonStyles.heading}>{post.data.title}</h2>
                  <p className={commonStyles.body}>{post.data.subtitle}</p>

                  <div className={styles.info}>
                    <time className={commonStyles.info}>
                      <FiCalendar />
                      {post.first_publication_date}
                    </time>
                    <address className={commonStyles.info}>
                      <FiUser />
                      {post.data.author}
                    </address>
                  </div>
                </a>
              </Link>
            ))}
          </div>

          {nextPage && (
            <button type="button" onClick={() => handleFetchPosts()}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const { results, next_page } = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 20,
    }
  );

  const posts = results.map(toPosts);

  const postsPagination = { results: posts, next_page };

  return { props: { postsPagination }, revalidate: 60 * 60 };
};
