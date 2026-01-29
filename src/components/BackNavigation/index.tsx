import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import RouteMap from '../../constants/routes';

const BackNavigation: React.FC = () => {
  const { pathname } = useLocation();
  const pathnames = pathname.split('/').filter(x => x);

  return (
    <nav className="flex items-center space-x-4 mb-4" aria-label="Breadcrumb" >
      <ol className="flex items-center space-x-2" >
        <>
          <Link to={RouteMap.DASHBOARD} className="text-sm text-gray-500 hover:text-gray-700 capitalize" >
            Home
          </Link>
          {
            pathnames.map((name, index) => {
              const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              return (
                <li key={routeTo} className="flex items-center" >
                  <span className="mx-2 text-gray-400" > /</span >
                  {
                    isLast ? (
                      <span className="text-sm font-semibold capitalize" >
                        {name.replace(/-/g, ' ')}
                      </span>
                    ) : (
                      <Link
                        to={routeTo}
                        className="text-sm text-gray-500 hover:text-gray-700 capitalize"
                      >
                        {name.replace(/-/g, ' ')}
                      </Link>
                    )
                  }
                </li>
              );
            })
          }
        </>
      </ol>
    </nav >
  );
};

export default BackNavigation;
