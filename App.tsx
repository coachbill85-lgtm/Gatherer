import React, { useState, useCallback } from 'react';
import { EstablishmentDetails } from './types';
import { fetchEstablishmentDetails } from './services/geminiService';
import { SearchInput } from './components/SearchInput';
import { ResultsCard } from './components/ResultsCard';
import { Loader } from './components/Loader';
import { RobotIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>("Coffee shops near Bryant Park, NYC");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [establishmentDetails, setEstablishmentDetails] = useState<EstablishmentDetails[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError("Please enter an establishment name.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEstablishmentDetails(null);

    let location: { latitude: number, longitude: number } | undefined = undefined;
    try {
      location = await new Promise((resolve) => {
        if (!navigator.geolocation) {
          console.warn("Geolocation is not supported by this browser.");
          return resolve(undefined);
        }
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          (err) => {
            console.warn(`Geolocation error: ${err.message}`);
            return resolve(undefined); 
          },
          { timeout: 5000 }
        );
      });
    } catch (e) {
      console.warn("An unexpected error occurred during geolocation fetching.", e);
    }

    try {
      const details = await fetchEstablishmentDetails(query, location);
      setEstablishmentDetails(details);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <RobotIcon className="w-10 h-10 text-sky-500" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Establishment Gatherer
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Enter a business name or category to retrieve public contact and location details.
          </p>
        </header>

        <main>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mb-6">
            <SearchInput
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>

          {isLoading && <Loader />}

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {establishmentDetails && !isLoading && (
            <div className="space-y-6">
              {establishmentDetails.length > 0 ? (
                establishmentDetails.map((details, index) => (
                  <ResultsCard key={details.establishment_name + index} details={details} />
                ))
              ) : (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg text-center">
                  <p className="text-slate-600 dark:text-slate-300">No results found for your query. Try being more specific or check for typos.</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
       <footer className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
          <p>Powered by Google Gemini</p>
       </footer>
    </div>
  );
};

export default App;