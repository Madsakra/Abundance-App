import { useContext, createContext, type PropsWithChildren, useState, useEffect } from 'react';
import { useStorageState } from './useStorageState';
import { api_endpoint } from './utils';

// Define the user type
interface User {
  id: number;
  username:string;
  role:string;
  subscription:string;
  email:string;
  password_hash:string;
  is_verify:boolean;
  created_at:string;
  updated_at:string;
}

const AuthContext = createContext<{
    user: User | null;
    signIn: (email:string,password:string) => Promise<string>;
    signOut: () => void;
    session?: string | null;
    isLoading: boolean;
}>({
    user:null,
    signIn: async () => '',
    signOut: () => null,
    session: null,
    isLoading: false,
    
  });


// This hook can be used to access the user info.
export function useSession() {
    const value = useContext(AuthContext);
    if (process.env.NODE_ENV !== 'production') {
      if (!value) {
        throw new Error('useSession must be wrapped in a <SessionProvider />');
      }
    }
  
    return value;
  }

  
export function SessionProvider({ children }: PropsWithChildren) {
    const [[isLoading, session], setSession] = useStorageState('session');
    const [user,setUser] = useState<User|null>(null);


      // If a session token exists, fetch user data
      const fetchUserData = async () => {
        if (session) {
            try {
                const response = await fetch(`${api_endpoint}/api/v1/user/auth/status`, {
                    method: 'GET',
                    headers: {
                        Authorization: `${session}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(data);
                    setUser(data); // Save fetched user data globally
                } else {
                    console.error('Failed to fetch user data:', response.statusText);
                    setUser(null); // Clear user data on failure
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUser(null);
            }
        }
    };


    useEffect(() => {


      fetchUserData();
  }, [session]); // Run when session changes





  const signIn = async (email:string,password:string) =>{
   
 
   


  
      const response = await fetch(`${api_endpoint}/api/v1/user/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      console.log(response);

      if (!response.ok) {
        console.log(response);
        throw new Error(`Network response was not ok: ${response.status}`);
      
      }
  
      const data = await response.json();
      console.log('Login successful:', data.token);
  
      setSession(data.token);
  
      // Fetch authentication status (you might need to implement this function in your app)
      fetchUserData();
  
      return data;
    
  }






    return (
      <AuthContext.Provider
        value={{

          signIn,
          signOut: () => {
            setSession(null);
          },
          session,
          isLoading,
          user,
        }}>
        {children}
      </AuthContext.Provider>
    );
  }