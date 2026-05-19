import { useState, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import './styles/index.css';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import DivisionPage from './pages/DivisionPage';
import KDProgrammePage from './pages/KDProgrammePage';
import HRHCadrePage from './pages/HRHCadrePage';
import DrugsDiagnosticsPage from './pages/DrugsDiagnosticsPage';
import KDIndicatorDetail from './pages/KDIndicatorDetail';
import CurrentStatusDetailPage from './pages/CurrentStatusDetailPage';

export default function App() {
  const [view, setView] = useState({
    page: 'home', program: null, division: null, indicator: null,
  });

  const pageRef = useRef(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  /* ── Zoom transition (scale + fade) ─────────────────────────────── */
  const transitionTo = useCallback((newView) => {
    const page = pageRef.current;
    if (!page) { setView(newView); return; }

    gsap.killTweensOf(page);

    gsap.to(page, {
      scale: 0.95, opacity: 0,
      duration: 0.20, ease: 'power2.in',
      onComplete: () => {
        setView(newView);
        gsap.fromTo(page,
          { scale: 1.04, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.30, ease: 'power3.out' },
        );
      },
    });
  }, []);

  const goToDivision = useCallback((division) => {
    transitionTo({ page: 'division', program: null, division, indicator: null, origin: 'home' });
  }, [transitionTo]);

  const goToDetail = useCallback((program, division) => {
    const origin = viewRef.current.page;
    transitionTo({ page: 'kd-list', program, division, indicator: null, origin });
  }, [transitionTo]);

  const goToIndicator = useCallback((indicator) => {
    transitionTo({ ...viewRef.current, page: 'kd-indicator', indicator });
  }, [transitionTo]);

  const goToCurrentStatus = useCallback((program, division) => {
    transitionTo({ page: 'current-status', program, division, indicator: null, origin: 'division' });
  }, [transitionTo]);

  const goHome = useCallback(() => {
    transitionTo({ page: 'home', program: null, division: null, indicator: null });
  }, [transitionTo]);

  const goToSummary = useCallback(() => {
    transitionTo({ page: 'summary', program: null, division: null, indicator: null });
  }, [transitionTo]);

  const goBack = useCallback(() => {
    const cur = viewRef.current;
    if (cur.page === 'kd-indicator') {
      transitionTo({ ...cur, page: 'kd-list', indicator: null });
    } else if (cur.page === 'current-status') {
      transitionTo({ page: 'division', program: null, division: cur.division, indicator: null, origin: 'home' });
    } else if (cur.page === 'kd-list' && cur.origin === 'division') {
      transitionTo({ page: 'division', program: null, division: cur.division, indicator: null, origin: 'home' });
    } else {
      goHome();
    }
  }, [transitionTo, goHome]);

  const renderPage = () => {
    if (view.page === 'home') {
      return <LandingPage onSelectDivision={goToDivision} onViewSummary={goToSummary} />;
    }
    if (view.page === 'summary') {
      return <HomePage onSelectProgram={goToDetail} onSelectDivision={goToDivision} onBack={goHome} />;
    }
    if (view.page === 'kd-list') {
      if (view.division?.id === 'hrh') {
        return (
          <HRHCadrePage
            program={view.program}
            division={view.division}
            onBack={goBack}
            onCurrentStatus={goToCurrentStatus}
          />
        );
      }
      if (view.division?.id === 'hss' && view.program?.id === 'drugs-diagnostics') {
        return (
          <DrugsDiagnosticsPage
            division={view.division}
            onBack={goBack}
          />
        );
      }
      return (
        <KDProgrammePage
          program={view.program}
          division={view.division}
          onBack={goHome}
          onSelectIndicator={goToIndicator}
          onCurrentStatus={goToCurrentStatus}
        />
      );
    }
    if (view.page === 'division') {
      return (
        <DivisionPage
          division={view.division}
          onBack={goHome}
          onSelectProgram={goToDetail}
          onCurrentStatus={goToCurrentStatus}
        />
      );
    }
    if (view.page === 'current-status') {
      return (
        <CurrentStatusDetailPage
          program={view.program}
          division={view.division}
          onBack={goBack}
        />
      );
    }
    if (view.page === 'kd-indicator') {
      return (
        <KDIndicatorDetail
          indicator={view.indicator}
          program={view.program}
          division={view.division}
          onBack={goBack}
        />
      );
    }
    return (
      <DetailPage
        program={view.program}
        division={view.division}
        onBack={goHome}
      />
    );
  };

  return (
    <>
      <div className="aurora-blobs" aria-hidden="true">
        <div className="blob blob--1" />
        <div className="blob blob--2" />
        <div className="blob blob--3" />
        <div className="blob blob--4" />
        <div className="blob blob--5" />
      </div>
      <div className="flip-stage">
        <div className="flip-page" ref={pageRef}>
          {renderPage()}
        </div>
      </div>
    </>
  );
}
