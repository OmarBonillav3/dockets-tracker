import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext.jsx';
import { Nav } from './components/Nav.jsx';
import { Home } from './screens/Home.jsx';
import { DailyReview } from './screens/DailyReview.jsx';
import { Matters } from './screens/Matters.jsx';
import { MatterDetail } from './screens/MatterDetail.jsx';
import { Search } from './screens/Search.jsx';
import { MonthlySummary } from './screens/MonthlySummary.jsx';
import { Export } from './screens/Export.jsx';
import { Settings } from './screens/Settings.jsx';

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <div className="app-shell">
        <Nav />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/review" element={<DailyReview />} />
            <Route path="/matters" element={<Matters />} />
            <Route path="/matters/:id" element={<MatterDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/summary" element={<MonthlySummary />} />
            <Route path="/export" element={<Export />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        </div>
      </BrowserRouter>
    </DataProvider>
  );
}
