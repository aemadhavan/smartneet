// Basic script to test the API directly
const fetchData = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/questions/1379');
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

fetchData();