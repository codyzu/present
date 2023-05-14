import {Document, Page} from 'react-pdf';
import * as pdfjs from 'pdfjs-dist';
import {useState, type PropsWithChildren, useEffect} from 'react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {useParams} from 'react-router-dom';
import useConfetti from './use-confetti';
import './pdf.css';
import {useSlideIndex} from './use-slide-index';
import useBroadcastSupaBase from './use-broadcast-supabase';
import useSearchParametersSlideIndex from './use-search-parameter-slide-index';
import Confetti from './Confetti';
import {presentations} from './presentation-urls';

const src = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url);
pdfjs.GlobalWorkerOptions.workerSrc = src.toString();

export default function Viewer() {
  const {presentationSlug} = useParams();
  useEffect(() => {
    document.title = `Present - ${presentationSlug!} - Audience`;
  }, [presentationSlug]);
  const [fire, setFire] = useState<boolean | Record<string, unknown>>(false);
  const {postConfetti} = useConfetti(
    presentationSlug!,
    useBroadcastSupaBase,
    setFire,
  );
  const {setSlideCount, slideIndex, setSlideIndex} = useSlideIndex(
    useBroadcastSupaBase,
    presentationSlug!,
    true,
  );
  useSearchParametersSlideIndex(setSlideIndex, slideIndex);

  function Message({children}: PropsWithChildren) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 position-relative overflow-x-hidden overflow-y-auto min-h-screen">
      <div className="max-w-2xl mx-auto">
        <Document
          className="w-full aspect-video"
          file={presentations[presentationSlug!]}
          loading={<Message>Loading...</Message>}
          error={<Message>Loading failed.</Message>}
          noData={<Message>No PDF file found.</Message>}
          onLoadSuccess={(pdf) => {
            setSlideCount(pdf.numPages);
          }}
        >
          <Page
            key={`page-${slideIndex}`}
            className="w-full h-full"
            pageIndex={slideIndex}
          />
        </Document>
      </div>

      <Confetti fire={fire} />
      <div className="max-w-lg mx-auto flex flex-col gap-4">
        <button
          type="button"
          className="btn position-relative"
          onClick={() => {
            setFire({});
            postConfetti({});
          }}
        >
          Boom 🎉
        </button>
        <div className="prose text-center position-relative">
          <a href="https://devrel.codyfactory.eu">Learn more</a>
        </div>
      </div>
    </div>
  );
}
