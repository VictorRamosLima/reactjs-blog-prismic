/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { formatDate } from '../../utils/formatDate';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: { url: string };
    author: string;
    content: Array<{
      heading: string;
      body: Array<{ text: string }>;
    }>;
  };
}

interface PostProps {
  post: Post;
}

export default function Post({
  post: { data, first_publication_date },
}: PostProps): JSX.Element {
  const router = useRouter()
  const readingTime = data.content.reduce(
    (acc, section) =>
      acc + Math.ceil(RichText.asText(section.body).split(' ').length / 200),
    0
  );

  return (
      router.isFallback ? (
        <>
          <Header />
          <div>Carregando...</div>
        </>
      ) : (
        <>
          <Header />
          <Head>
            <title>{data.title} | spacetravelling</title>
          </Head>

          <main className={styles.container}>
            <img src={data.banner.url} alt="banner" />

            <article className={styles.post}>
              <h1 className={commonStyles.heading}>{data.title}</h1>

              <div className={styles.info}>
                <time className={commonStyles.info}>
                  <FiCalendar />
                  {formatDate(first_publication_date)}
                </time>
                <address className={commonStyles.info}>
                  <FiUser />
                  {data.author}
                </address>
                <span className={commonStyles.info}>
                  <FiClock />
                  {readingTime} min
                </span>
              </div>

              <div className={styles.content}>
                {data.content.map(section => (
                  <section key={section.heading}>
                    <h2 className={commonStyles.heading}>{section.heading}</h2>
                    {section.body.map((content, index) => (
                      <p key={`${section.heading}-${index}`}>{content.text}</p>
                    ))}
                  </section>
                ))}
              </div>
            </article>
          </main>
        </>
      )
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.slug'],
      pageSize: 100,
    }
  );

  return {
    paths: response.results.map(result => ({ params: { slug: result?.uid } })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const { uid, data, first_publication_date } = await prismic.getByUID(
    'post',
    String(slug),
    {}
  );

  const post = {
    uid,
    first_publication_date,
    data: {
      title: data.title,
      subtitle: data.subtitle,
      author: data.author,
      banner: { url: data.banner.url },
      content: data.content.map(section => ({
        heading: section.heading,
        body: section.body
      })),
    },
  };

  return { props: { post }, revalidate: 60 * 60 };
};
