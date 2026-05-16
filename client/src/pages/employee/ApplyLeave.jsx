import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ApplyLeave() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/employee/my-leaves?apply=true', { replace: true });
  }, [navigate]);

  return null;
}

export default ApplyLeave;
