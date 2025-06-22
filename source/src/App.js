import { useEffect, useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import parse from 'html-react-parser';
import './App.css';

function App() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const years = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const [selectedYears, setSelectedYears] = useState(years);
  const [key, setKey] = useState('')
  const [percent, setPercent] = useState(0)
  const [numResults, setNumResults] = useState(0)
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
  }, [search]);

  useEffect(() => {
    setErrorMessage('');
  }, [key]);

  const getData = async () => {
    if (!key) {
      setErrorMessage("Please enter an API key.");
      return;
    }
    if (!search) {
      setErrorMessage("Please enter a search term.");
      return;
    }
    setPercent(0);
    setNumResults(0);
    setData([]);
    setErrorMessage('');

    const updatePercent = (increment) => {
      setPercent(prevPercent => prevPercent + increment);
    };

    let allResults = [];
    for (const year of selectedYears) {
      var searchOrList = search.split('/');
      for (const search of searchOrList) {
        const url = `https://api.regulations.gov/v4/documents?filter[docketId]=FDA-${year}-S-0024&filter[searchTerm]=${search}&page[size]=250&api_key=${key}`;
        const response = await fetch(url);
        if (!response.ok) {
          handleHTTPError(response.status);
          return;
        }
        const result = await response.json();
        allResults = allResults.concat(result);
        // remove duplicates
        allResults = [...new Set(allResults)]
        let percentIncrement = 100 / (selectedYears.length * searchOrList.length);
        updatePercent(percentIncrement);
      }
      // const url = `https://api.regulations.gov/v4/documents?filter[docketId]=FDA-${year}-S-0024&filter[searchTerm]=${search}&page[size]=250&api_key=${key}`;
      // const response = await fetch(url);
      // if (!response.ok) {
      //   handleHTTPError(response.status);
      //   return;
      // }
      // const result = await response.json();
      // allResults = allResults.concat(result);
      // setPercent(prevPercent => prevPercent + 100 / selectedYears.length); 
    }
    console.log(allResults);
    setNumResults(allResults.reduce((acc, item) => acc + (item.data.length), 0));
    // console.log(numResults);
    setData(allResults);
  }

  // this is a bad way to generate a unique key for each item in the list
  // BUT GOOD ENOUGH :D
  const cantorPairing = (a, b) => {
    return 0.5 * (a + b) * (a + b + 1) + b;
  }

  const selectAllYears = () => {
    setSelectedYears(years);
  }

  const deselectAllYears = () => {
    setSelectedYears([]);
  }


  // error handling for HTTP requests add any additional error codes as needed, i dont think
  // the API will return anything other than 403, 429, 400,
  const handleHTTPError = (status) => {
    switch (status) {
      case 403:
        setErrorMessage("Your API key is invalid.");
        break;
      case 429:
        setErrorMessage("Rate limit exceeded, please try again later.");
        break;
      case 400:
      case 404:
      case 500:
        setErrorMessage(`An error occurred with status code ${status}. Please check your inputs or try again later.`);
        break;
      default:
        setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  const toggleYear = (year) => {
    if (selectedYears.includes(year)) {
      setSelectedYears(selectedYears.filter(y => y !== year));
    } else {
      setSelectedYears([...selectedYears, year]);
    }
  }

  // this can be more infomative and intelligent
  const convertToCSV = (data) => {
    const csvRows = [];
    csvRows.push("Title,ID,URL,Date");
  
    data.forEach(item => {
      item.data.forEach(subItem => {
        const title = subItem.attributes.title.replace(/[,\n\r"';]/g, '');
        const id = subItem.id;
        const date = subItem.attributes.postedDate.slice(0,10);
        const url = `https://www.regulations.gov/document/${subItem.id}`;
        csvRows.push(`${title},${id},${url}, ${date}`);
      });
    });
  
    return csvRows.join("\n");
  };
  
  const downloadCSV = () => {
    if (!data.length) {
      alert("No data to download!");
      return;
    }
  
    const filename = "docket-results"
    if (filename) {
      const csvData = convertToCSV(data);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${filename}.csv`);
    }
  };
  

  const percentageRef = useRef(null);

  useEffect(() => {
    if (percentageRef.current) {
      percentageRef.current.style.width = `${percent}%`;
    }
  }, [percent]);
  
  
  return (
    <div className="App">
      <div className="search-container">
        <div className="years">
          <div className="checkboxes">
            {years.map(year => (
              <div key={year}>
                <input type="checkbox" id={"ch-"+year} checked={selectedYears.includes(year)} onChange={() => toggleYear(year)} />
                <label htmlFor={"ch-"+year}>{year}</label>
              </div>
            ))}
          </div>
          <div className="button-container">
            <button onClick={selectAllYears}>Select All Years</button>
            <button onClick={deselectAllYears}>Deselect All Years</button>
          </div>
        </div>
        <div className='search'>
          <input type="text" value={key} onChange={e => setKey(e.target.value)} placeholder='API Key' />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder='Search Term' />
          {errorMessage && <div className="error">{errorMessage}</div>}
          <button onClick={getData}>Search</button>
          <button onClick={downloadCSV}>Download Results as CSV</button>
        </div>
      </div>

      {numResults > 0 && <div className="results">
        <h2>Results</h2>
        <p>Number of results: {numResults}</p>
      </div>}
      <ul>
        {numResults > 0 && data.map((item, index) => (
          item.data.map((subItem, subIndex) => (
            <li key={cantorPairing(index, subIndex)}>
              <div className="article" key={cantorPairing(index, subIndex)}>
                <div className="top-line">
                  <h3>{subItem.attributes.title}</h3>
                  <small>Posted {subItem.attributes.postedDate.slice(0,10)}</small>
                </div>
                <a href={`https://www.regulations.gov/document/${subItem.id}`}>{subItem.id}</a>
                <p>{parse(subItem.attributes.highlightedContent)}</p>
              </div>
            </li>
          ))
        ))}
      </ul>
      {percent > 0 && <div className="progressBar" ref={percentageRef}></div>}    
    </div>
  );

}

export default App;