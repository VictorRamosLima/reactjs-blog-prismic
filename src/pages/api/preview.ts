import { Document } from '@prismicio/client/types/documents';
import { NextApiRequest, NextApiResponse } from 'next';

import { getPrismicClient } from '../../services/prismic'

const linkResolver = (document: Document): string => {
  if (document.type === 'posts') {
    return `/post/${document.uid}`;
  }
  return '/';
}

export const Preview = async (
  request: NextApiRequest,
  response: NextApiResponse
): Promise<void> => {
  const { token: ref, documentId } = request.query;

  const redirectUrl = await getPrismicClient(request)
    .getPreviewResolver(
      Array.isArray(ref) ? ref[0] : ref,
      Array.isArray(documentId) ? documentId[0] : documentId
    )
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return response.status(401).json({ message: 'Invalid token' });
  }

  response.setPreviewData({ ref });

  response.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="Refresh" content="0; url=${redirectUrl}" />
      <script>
        window.location.href='${redirectUrl}'
      </script>
    </head>
  `);

  response.end();
};
