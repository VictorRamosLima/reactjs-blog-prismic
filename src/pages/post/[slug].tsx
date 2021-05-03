/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { useEffect } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { formatDate } from '../../utils/formatDate';
import { formatDateAndHour } from '../../utils/formatDateAndHour';
import { PostReference } from '../../components/PostReference';
import { ExitFromPreviewModeButton } from '../../components/ExitFromPreviewModeButton';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  previousPost: Post | null;
  nextPost: Post | null;
  Post: Post | null;
  preview: boolean;
}

const toPost = (result?) => {
  return result ? ({
    uid: result.uid,
    first_publication_date: result.first_publication_date,
    last_publication_date: result.last_publication_date,
    data: {
      title: Array.isArray(result.data.title) ? RichText.asText(result.data.title) : result.data.title,
      subtitle: result.data.subtitle,
      author: result.data.author,
      banner: { url: result.data.banner.url },
      content: result.data.content.map(section => ({
        heading: section.heading,
        body: section.body
      })),
    },
  }) : null;
}


export default function Post({
  post: { data, first_publication_date, last_publication_date },
  previousPost,
  nextPost,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter()
  const readingTime = data.content.reduce(
    (acc, section) =>
      acc + Math.ceil(RichText.asText(section.body).split(' ').length / 200),
    0
  );

  useEffect(() => {
    const anchor = document.getElementById('inject-comments-for-uterances');
    const script = document.createElement('script');

    script.async = true;
    script.src = 'https://utteranc.es/client.js';
    script.crossOrigin = 'anonymous';

    script.setAttribute('repo', 'VictorRamosLima/spacetraveling-utterances');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'blog-comment');
    script.setAttribute('theme', 'github-dark');

    anchor.innerHTML = '';
    anchor.appendChild(script);
  }, [router.asPath]);

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

              {last_publication_date && (
                <span className={ `${commonStyles.info} ${styles.lastPublicationDate}`}>
                  {formatDateAndHour(last_publication_date)}
                </span>
              )}

              <div className={styles.content}>
                {data.content.map(section => (
                  <section key={section.heading}>
                    <h2 className={commonStyles.heading}>{section.heading}</h2>
                    <div
                      className={styles.postContent}
                      dangerouslySetInnerHTML={{ __html: RichText.asHtml(section.body) }}
                    />
                  </section>
                ))}
              </div>
            </article>
          </main>

          <hr className={styles.division} />

          <div className={styles.postReferences}>
            {previousPost && (
              <PostReference
                title={previousPost.data.title}
                actionName="Post anterior"
                uid={previousPost.uid}
              />
            )}

            {nextPost && (
              <PostReference
                title={nextPost.data.title}
                actionName="Próximo post"
                uid={nextPost.uid}
                textAlignRight={!!previousPost}
              />
            )}
          </div>

          <div id="inject-comments-for-uterances" />

          {preview && (
            <div className={styles.previewSection}>
              <ExitFromPreviewModeButton />
            </div>
          )}
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

export const getStaticProps: GetStaticProps = async ({ params, preview = false }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'post',
    String(slug),
    {}
  );

  const previousResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const previousPost = toPost(previousResponse?.results[0]) || null;
  const nextPost = toPost(nextResponse?.results[0]) || null;

  const post = toPost(response)
  return { props: { post, previousPost, nextPost, preview }, revalidate: 60 * 60 };
};
