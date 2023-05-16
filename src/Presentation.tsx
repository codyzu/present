import {useState, useEffect, useMemo, useCallback} from 'react';
import {Document, Page} from 'react-pdf';
import * as pdfjs from 'pdfjs-dist';
import QRCode from 'react-qr-code';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {useParams} from 'react-router-dom';
import {useSwipeable} from 'react-swipeable';
import './pdf.css';
import {useSlideIndex} from './use-slide-index';
import useKeys from './use-keys';
import useConfetti from './use-confetti';
import useBroadcastChannel from './use-broadcast-channel';
import useSearchParametersSlideIndex from './use-search-parameter-slide-index';
import useBroadcastSupabase from './use-broadcast-supabase';
import Confetti from './Confetti';
import {presentations} from './presentation-urls';
import {pageMessageProperties, pdfMessageProperties} from './PdfMessages';
import ProgressBar from './ProgressBar';

const src = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url);
pdfjs.GlobalWorkerOptions.workerSrc = src.toString();

function Presentation() {
  const {presentationSlug} = useParams();
  useEffect(() => {
    document.title = `Present - ${presentationSlug!}`;
  }, [presentationSlug]);

  const {
    slideIndex,
    setSlideIndex,
    forward,
    prevSlideIndex,
    nextSlideIndex,
    slideCount,
    setSlideCount,
    navNext,
    navPrevious,
  } = useSlideIndex(useBroadcastChannel, presentationSlug!);

  const swipeHandlers = useSwipeable({
    onSwipedRight() {
      navPrevious();
    },
    onSwipedLeft() {
      navNext();
    },
  });

  const {setSlideIndex: setSupabaseSlideIndex} = useSlideIndex(
    useBroadcastSupabase,
    presentationSlug!,
  );

  useEffect(() => {
    console.log('updating', slideIndex);
    setSupabaseSlideIndex(slideIndex);
  }, [slideIndex, setSupabaseSlideIndex]);

  useSearchParametersSlideIndex(setSlideIndex, slideIndex);

  const openSpeakerWindow = useCallback(
    () =>
      window.open(
        `${window.location.origin}${window.location.pathname}/speaker${window.location.search}`,
        undefined,
        'popup',
      ),
    [],
  );

  const [fire, setFire] = useState<boolean | Record<string, unknown>>(false);
  const [reset, setReset] = useState<boolean | Record<string, unknown>>(false);

  const resetConfetti = useCallback(() => {
    setReset({});
  }, [setReset]);

  useConfetti(presentationSlug!, useBroadcastChannel, setFire, resetConfetti);
  useConfetti(presentationSlug!, useBroadcastSupabase, setFire);

  const keyHandlers = useMemo(
    () =>
      new Map([
        ['ArrowLeft', navPrevious],
        ['ArrowRight', navNext],
        ['Space', navNext],
        ['KeyS', openSpeakerWindow],
        ['KeyC', resetConfetti],
      ]),
    [navPrevious, navNext, openSpeakerWindow, resetConfetti],
  );
  useKeys(keyHandlers);

  const slideWidth = Math.min(window.innerWidth, window.innerHeight * (16 / 9));

  // Show a slide under to fade the current slide on top of it
  function slideUnder() {
    // Nothing to render under when moving forward and at the start of the presentation
    if (forward && slideIndex <= 0) {
      return null;
    }

    // Nothing to render under when moving backwards and at the end of the presentation
    if (!forward && slideIndex >= slideCount - 1) {
      return null;
    }

    return (
      <Page
        key={`page-${forward ? prevSlideIndex : nextSlideIndex}`}
        pageIndex={forward ? prevSlideIndex : nextSlideIndex}
        className="w-full h-full important-position-absolute top-0 left-0 opacity-100"
        width={slideWidth}
        {...pageMessageProperties}
      />
    );
  }

  // Current slide transitions its opacity so that it fades in
  // It should have already been rendered (opacity 0) over
  const slideCurrent = (
    <Page
      key={`page-${slideIndex}`}
      className="transition transition-opacity duration-500 ease-linear opacity-100 w-full h-full important-position-absolute top-0 left-0"
      pageIndex={slideIndex}
      width={slideWidth}
      {...pageMessageProperties}
    />
  );

  // Hide a slide over to avoid seeing the loading message
  // This preloads and renders (hidden) the next slide
  function slideOver() {
    // Nothing to render over when moving forward and at the end of the presentation
    if (forward && slideIndex >= slideCount - 1) {
      return null;
    }

    // Nothing to render over when moving backwards and at the start of the presentation
    if (!forward && slideIndex <= 0) {
      return null;
    }

    return (
      <Page
        key={`page-${forward ? nextSlideIndex : prevSlideIndex}`}
        className="w-full h-full important-position-absolute top-0 left-0 opacity-0"
        pageIndex={forward ? nextSlideIndex : prevSlideIndex}
        width={slideWidth}
        {...pageMessageProperties}
      />
    );
  }

  console.log('handlers', swipeHandlers);

  return (
    <div className="pdf-container h-screen flex flex-col items-center justify-center overflow-hidden position-relative">
      <Document
        file={presentations[presentationSlug!]}
        className="w-full aspect-video position-relative max-w-[calc(100vh_*_(16/9))]"
        onLoadSuccess={(pdf) => {
          setSlideCount(pdf.numPages);
        }}
        {...pdfMessageProperties}
      >
        {/* Render the previous slide (if there is one) to provide a background to fade on to */}
        {slideUnder()}
        {/* Render the current page with a CSS transition that fades on to the slide under */}
        {slideCurrent}
        {/* Prerender the next page (if there is one) to avoid seeing loading messages */}
        {slideOver()}
      </Document>
      <Confetti fire={fire} reset={reset} />
      {/* Inspired from https://stackoverflow.com/a/44233700 */}
      <div className="position-absolute top-1rem w-10rem h-[calc(100%_-_10rem_-_2rem)] right-4 animate-longbounce 2xl:w-12rem 2xl:h-[calc(100%_-_12rem_-_2rem)] lt-sm:w-8rem lt-sm:h-[calc(100%_-_8rem_-_2rem)]">
        <div className=" bg-white p-2 w-10rem h-10rem 2xl:w-12rem 2xl:h-12rem lt-sm:w-8rem lt-sm:h-8rem">
          <QRCode
            value={`${window.location.origin}${window.location.pathname}/view${window.location.search}`}
            // Size={128}
            // level="Q"
            className="w-full h-full"
            style={{width: '100%', height: 'auto', maxWidth: '100%'}}
          />
        </div>
      </div>
      <ProgressBar slideIndex={slideIndex} slideCount={slideCount} />
      <div
        className="position-absolute top-0 left-0 h-full w-full"
        onClick={() => {
          navNext();
        }}
        {...swipeHandlers}
      />
    </div>
  );
}

export default Presentation;
