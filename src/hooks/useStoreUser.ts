import { useUser } from '@clerk/clerk-react'
import { useConvexAuth, useMutation } from 'convex/react'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

/**
 * Custom hook that stores the current Clerk user in Convex.
 * Call this hook at app initialization to ensure the user exists in the database.
 */
export function useStoreUser() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { user } = useUser()
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const storeUser = useMutation(api.users.store)

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/c2ddf3bc-d56b-4bf3-aaed-1ce933513c00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useStoreUser.ts:19',message:'useConvexAuth state',data:{isLoading,isAuthenticated,clerkUserId:user?.id,currentUserId:userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,E'})}).catch(()=>{});
  }, [isLoading, isAuthenticated, user?.id, userId]);
  // #endregion

  useEffect(() => {
    if (!isAuthenticated) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c2ddf3bc-d56b-4bf3-aaed-1ce933513c00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useStoreUser.ts:27',message:'Not authenticated, skipping store',data:{isAuthenticated,isLoading},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setUserId(null)
      return
    }

    async function createUser() {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c2ddf3bc-d56b-4bf3-aaed-1ce933513c00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useStoreUser.ts:35',message:'Calling storeUser mutation',data:{clerkUserId:user?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      try {
        const id = await storeUser()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/c2ddf3bc-d56b-4bf3-aaed-1ce933513c00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useStoreUser.ts:40',message:'storeUser mutation SUCCESS',data:{odid:id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setUserId(id)
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/c2ddf3bc-d56b-4bf3-aaed-1ce933513c00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useStoreUser.ts:45',message:'storeUser mutation FAILED',data:{error:String(err)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B'})}).catch(()=>{});
        // #endregion
      }
    }

    createUser()
  }, [isAuthenticated, storeUser, user?.id])

  // #region agent log
  const returnValue = {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
    userId,
  };
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/c2ddf3bc-d56b-4bf3-aaed-1ce933513c00',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useStoreUser.ts:58',message:'useStoreUser return value',data:returnValue,timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
  }, [returnValue.isLoading, returnValue.isAuthenticated, returnValue.userId]);
  // #endregion

  return returnValue
}
