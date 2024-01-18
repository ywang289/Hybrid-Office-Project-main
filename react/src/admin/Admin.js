import React, { useState } from 'react';
import Menu from '../Menu';
import './Admin.css';
import { useAuth } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

function Admin() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [data, setData]= useState('')
    const [newLocation, setNewLocation] = useState(data.permanent_location);
    const { token } = useAuth();
    const decoded = jwtDecode(token);
    const user_premission = decoded.permission;

    const permissionOptions = [
        { value: 1, label: "Every permission" },
        { value: 2, label: "HR Manager - Admin everyone > 2, All Seat Dashboard View" },
        { value: 3, label: "HR Member - All Seat Dashboard View" },
        { value: 4, label: "Department Manager - Admin everyone in Department, Department Seat Dashboard View" },
        { value: 5, label: "Department Member - Department Seat Dashboard View" },
        { value: 6, label: "Normal User" }
    ];


    

    const [showUpdateLocation, setShowUpdateLocation] = useState(false);
    

    const handleFinishChange = async () => {
      try {
          const response = await fetch('/update-admin', {
              method: 'POST', 
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  data
              }),
          });

          if (!response.ok) {
              throw new Error('Update failed');
          }

          console.log('Update successful');
      } catch (error) {
          console.error('Failed to update:', error);
      }
  };

    const handleShowUpdateLocation = () => {
        if (user_premission < data.permission) {
            setShowUpdateLocation(true);
        } else {
           
            alert("You do not have permission to change this.");
        }
    };

    const handleShowUpdatePermission = () => {
        
        if (user_premission < data.permission) {
            setShowUpdatePermission(true);
        } else {
            
            alert("You do not have permission to change this.");
        }
    };

    const handleUpdateLocation = () => {
      
      setData(data => ({ ...data, permanent_location: newLocation }));
      setShowUpdateLocation(false); 
  };

  

  const handleCancelLocationUpdate = () => {
      setNewLocation(data.permanent_location); 
      setShowUpdateLocation(false); 
  };

  const [newPermission, setNewPermission] = useState(data.permission);
  const [showUpdatePermission, setShowUpdatePermission] = useState(false);


  const getPermissionLabel = (permissionValue) => {
    const option = permissionOptions.find(opt => opt.value === permissionValue);
    console.log(option)
    return option ? option.label : "Unknown Permission";
};

const handleUpdatePermission = () => {
    // 确保转换为数字，因为下拉菜单可能返回字符串
    const updatedPermission = parseInt(newPermission);
    setData(data => ({ ...data, permission: updatedPermission }));
    setShowUpdatePermission(false); 
};

    const handleCancelPermissionUpdate = () => {
        setNewPermission(data.permission); 
        setShowUpdatePermission(false); 
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        setError('');
        try {
            const response = await fetch('/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error( 'Employee search failed');
            }

            // Handle success (e.g., display data)
            console.log('Employee Data:', data);
            setData(data);
            
        } catch (error) {
            console.error('Load Data Failed:', error);
            setError("Invaild email, please change");
        }
    };

    const handleClear = () => {
        setEmail('');
        setError('');
    };

    return (
      <div>
        <Menu />
        <div className='access'> 
            
            <div className='search-section'>
                <h1>Search Employee:</h1>
                <form onSubmit={handleSearch}>
                    <div>
                        Email: 
                        <input type="text" value={email} onChange={e => setEmail(e.target.value)} />
                        <button type="submit">Search</button>
                        <button type="button" onClick={handleClear}>Clear</button>
                    </div>
                </form>
                {error && <p className="error">{error}</p>}
                {
                  data && (
                    <div className='access'>
                    <table>
                    <tbody>
                        <tr>
                            <th>Employer</th>
                            <td>{data.employer}</td>
                        </tr>
                        <tr>
                            <th>Email</th>
                            <td>{data.email}</td>
                        </tr>
                        <tr>
                            <th>First Name</th>
                            <td>{data.firstName}</td>
                        </tr>
                        <tr>
                            <th>Last Name</th>
                            <td>{data.lastName}</td>
                        </tr>
                        <tr>
                            <th>Department</th>
                            <td>{data.department}</td>
                        </tr>
                        <tr>
                            <th>Classification</th>
                            <td>{data.classification}</td>
                        </tr>
                        <tr>
                            <th>Permanent Location</th>
                            <td>
                            {showUpdateLocation ? (
                                <>
                                <input 
                                    type="text" 
                                    value={newLocation} 
                                    onChange={(e) => setNewLocation(e.target.value)}
                                />
                                <button onClick={handleUpdateLocation}>Change</button>
                                <button onClick={handleCancelLocationUpdate}>Cancel</button>
                            </>
                                  
                              ) : (
                                  data.permanent_location
                              )}
                          </td>
                          <td>
                              <button onClick={handleShowUpdateLocation}>Change</button>
                          </td>
                        </tr>
                        <tr>
                        <th>Permission</th>
                        <td>
                            {showUpdatePermission ? (
                                 <>
                                 
                                 <select 
                                    value={newPermission} 
                                    onChange={(e) => setNewPermission(e.target.value)}
                                >
                                    {permissionOptions
                                        .filter(option => option.value > user_premission)
                                        .map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))
                                    }
                                </select>
                                 <button onClick={handleUpdatePermission}>Change</button>
                                 <button onClick={handleCancelPermissionUpdate}>Cancel</button>
                             </>
                            ) : (
                                getPermissionLabel(data.permission)
                            )}
                        </td>
                        <td>
                            <button onClick={handleShowUpdatePermission}>Change</button>
                        </td>
                        </tr>
                    </tbody>
                    <button type="button" onClick={handleFinishChange}>Finish Change</button>
                </table>
                </div>
                  )
                }

                
               
          
                
            </div>
        </div>
        </div>
    );
}

export default Admin;