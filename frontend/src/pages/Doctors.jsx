import React, { useState, useEffect } from "react";
import axios from "axios";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/doctors");
        setDoctors(response.data.data);
      } catch (err) {
        console.error("Failed to fetch doctors from backend.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg animate-pulse">
          Loading doctors...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Doctors</h1>
      {doctors.length === 0 ? (
        <p className="text-gray-500">No doctors found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="bg-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                  {doc.fullName[0]}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {doc.fullName}
                  </h2>
                  <p className="text-sm text-gray-500">{doc.specialization}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Email: {doc.email}</p>
                {doc.phone && <p>Phone: {doc.phone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Doctors;
