import { useCallback, useRef } from 'react'
import Analytics from '@aws-amplify/analytics'
import Auth from '@aws-amplify/auth'
import { usePreferences } from '../../lib/preferences'
import { DbStore } from '../../lib/db'
import { useEffectOnce } from 'react-use'

const amplifyConfig = {
  Auth: {
    identityPoolId: process.env.MOBILE_AMPLIFY_AUTH_IDENTITY_POOL_ID,
    region: process.env.MOBILE_AMPLIFY_AUTH_REGION,
  },
}

const analyticsConfig = {
  AWSPinpoint: {
    appId: process.env.MOBILE_AMPLIFY_PINPOINT_APPID,
    region: process.env.MOBILE_AMPLIFY_PINPOINT_REGION,
    mandatorySignIn: false,
  },
}

export function useAnalytics() {
  const configured = useRef(false)
  const { preferences } = usePreferences()
  const analyticsEnabled = preferences['general.enableAnalytics']
  const user = preferences['general.accounts'][0]

  useEffectOnce(() => {
    Auth.configure(amplifyConfig)
    Analytics.configure(analyticsConfig)
    configured.current = true
    const initilalized = (window as any).initilalized
    if (!initilalized) {
      ;(window as any).initilalized = true
      Analytics.record('init')
    }
    Analytics.updateEndpoint({
      attributes: {
        userId: user == null ? [] : [user.id.toString()],
        target: [process.env.TARGET == null ? 'dev' : process.env.TARGET],
      },
    })
  })

  const report = useCallback(
    (name: string, attributes?: { [key: string]: string }) => {
      if (analyticsEnabled) {
        if (attributes == null) {
          Analytics.record({ name: name })
        } else {
          Analytics.record({ name, attributes })
        }
      }
    },
    [analyticsEnabled]
  )

  return {
    report,
  }
}

export const analyticsEvents = {
  addNote: 'Note.Add',
  editNote: 'Note.Edit',
  deleteNote: 'Note.Delete',
  addTag: 'Tag.Add',
  addStorage: 'Storage.Add',
  addFolder: 'Folder.Add',
  colorTheme: 'ColorTheme.Edit',
  editorTheme: 'EditorTheme.Edit',
}

export function wrapDbStoreWithAnalytics(hook: () => DbStore): () => DbStore {
  return () => {
    const { report } = useAnalytics()
    const {
      createNote,
      updateNote,
      trashNote,
      createStorage,
      createFolder,
      ...rest
    } = hook()
    return {
      createNote: useCallback(
        (...args: Parameters<typeof createNote>) => {
          report(analyticsEvents.addNote)
          return createNote(...args)
        },
        [createNote, report]
      ),
      updateNote: useCallback(
        (...args: Parameters<typeof updateNote>) => {
          report(analyticsEvents.editNote)
          return updateNote(...args)
        },
        [updateNote, report]
      ),
      trashNote: useCallback(
        (...args: Parameters<typeof trashNote>) => {
          report(analyticsEvents.deleteNote)
          return trashNote(...args)
        },
        [trashNote, report]
      ),
      createStorage: useCallback(
        (...args: Parameters<typeof createStorage>) => {
          report(analyticsEvents.addStorage)
          return createStorage(...args)
        },
        [createStorage, report]
      ),
      createFolder: useCallback(
        (...args: Parameters<typeof createFolder>) => {
          report(analyticsEvents.addFolder)
          return createFolder(...args)
        },
        [createFolder, report]
      ),
      ...rest,
    }
  }
}
