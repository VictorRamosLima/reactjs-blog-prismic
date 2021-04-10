/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

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
  const readingTime = data.content.reduce(
    (acc, section) =>
      acc + Math.ceil(RichText.asText(section.body).split(' ').length / 200),
    0
  );

  return (
    <>
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
              {first_publication_date}
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
                {section.body.map(content => (
                  <p>{content.text}</p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
    </>
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
    paths: response.results.flatMap(result =>
      result.slugs.map(slug => ({ params: { slug } }))
    ),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const { data, first_publication_date } = await prismic.getByUID(
    'post',
    String(slug),
    {}
  );

  const post = {
    first_publication_date: formatDate(first_publication_date),
    data: {
      title: RichText.asText(data.title),
      author: data.author,
      banner: { url: data.banner.url },
      content: data.content.map(section => ({
        heading: section.heading,
        body: section.body.map(bodySection => ({
          text: bodySection.text,
        })),
      })),
    },
  };

  return { props: { post }, revalidate: 60 * 60 };
};
