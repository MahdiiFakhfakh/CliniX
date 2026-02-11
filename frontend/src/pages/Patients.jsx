import React, { useState, useEffect } from "react";
import axios from "axios";

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/patients");
        setPatients(response.data.data);
      } catch (error) {
        console.error("Failed to fetch patients", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg animate-pulse">
          Loading patients...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Patients</h1>

      {patients.length === 0 ? (
        <p className="text-gray-500">No patients found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {patients.map((patient) => (
            <div
              key={patient._id}
              className="bg-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  {patient.fullName[0]}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {patient.fullName}
                  </h2>
                  <p className="text-sm text-gray-500">{patient.email}</p>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {patient.phone && <p>Phone: {patient.phone}</p>}
                {patient.age && <p>Age: {patient.age}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Patients;
