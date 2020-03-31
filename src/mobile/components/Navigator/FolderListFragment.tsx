import React, { useMemo } from 'react'
import { useDb } from '../../lib/db'
import { useDialog, DialogIconTypes } from '../../../lib/dialog'
import { useContextMenu, MenuTypes } from '../../../lib/contextMenu'
import NavigatorItem from './NavigatorItem'
import { NoteStorage } from '../../../lib/db/types'
import { usePathnameWithoutNoteId, useRouter } from '../../lib/router'
import { useGeneralStatus } from '../../lib/generalStatus'
import ControlButton from './ControlButton'
import { getFolderItemId } from '../../../lib/nav'
import { IconAddRound, IconFile, IconFileOpen } from '../../../components/icons'
import { useTranslation } from 'react-i18next'

interface FolderListFragmentProps {
  storage: NoteStorage
  showPromptToCreateFolder: (folderPathname: string) => void
  showPromptToRenameFolder: (folderPathname: string) => void
}

const FolderListFragment = ({
  storage,
  showPromptToCreateFolder,
  showPromptToRenameFolder,
}: FolderListFragmentProps) => {
  const { removeFolder } = useDb()
  const { push } = useRouter()
  const { messageBox } = useDialog()
  const { popup } = useContextMenu()
  const { t } = useTranslation()

  const { folderMap, id: storageId } = storage

  const {
    toggleSideNavOpenedItem,
    sideNavOpenedItemSet,
    toggleNav,
  } = useGeneralStatus()

  const currentPathnameWithoutNoteId = usePathnameWithoutNoteId()

  const folderPathnames = useMemo(() => {
    return Object.keys(folderMap).sort((a, b) => a.localeCompare(b))
  }, [folderMap])

  const createOnFolderItemClickHandler = (folderPathname: string) => {
    return () => {
      push(
        `/m/storages/${storage.id}/notes${
          folderPathname === '/' ? '' : folderPathname
        }`
      )
      toggleNav()
    }
  }

  const createOnContextMenuHandler = (
    storageId: string,
    folderPathname: string
  ) => {
    return (event: React.MouseEvent) => {
      event.preventDefault()
      popup(event, [
        {
          type: MenuTypes.Normal,
          label: t('folder.create'),
          onClick: async () => {
            showPromptToCreateFolder(folderPathname)
          },
        },
        {
          type: MenuTypes.Normal,
          label: t('folder.rename'),
          enabled: folderPathname !== '/',
          onClick: async () => {
            showPromptToRenameFolder(folderPathname)
          },
        },
        {
          type: MenuTypes.Normal,
          label: t('folder.remove'),
          enabled: folderPathname !== '/',
          onClick: () => {
            messageBox({
              title: `Remove "${folderPathname}" folder`,
              message: t('folder.removeMessage'),
              iconType: DialogIconTypes.Warning,
              buttons: [t('folder.remove'), t('general.cancel')],
              defaultButtonIndex: 0,
              cancelButtonIndex: 1,
              onClose: (value: number | null) => {
                if (value === 0) {
                  removeFolder(storageId, folderPathname)
                }
              },
            })
          },
        },
      ])
    }
  }

  const folderSetWithSubFolders = useMemo(() => {
    return folderPathnames.reduce((folderSet, folderPathname) => {
      if (folderPathname !== '/') {
        const nameElements = folderPathname.slice(1).split('/')
        const parentFolderPathname =
          '/' + nameElements.slice(0, nameElements.length - 1).join('/')
        folderSet.add(parentFolderPathname)
      }
      return folderSet
    }, new Set())
  }, [folderPathnames])

  const openedFolderPathnameList = useMemo(() => {
    const tree = getFolderNameElementTree(folderPathnames)
    return getOpenedFolderPathnameList(
      tree,
      storageId,
      sideNavOpenedItemSet,
      '/'
    )
  }, [folderPathnames, storageId, sideNavOpenedItemSet])

  return (
    <>
      {openedFolderPathnameList.map((folderPathname: string) => {
        const nameElements = folderPathname.split('/').slice(1)
        const folderName = nameElements[nameElements.length - 1]
        const itemId = getFolderItemId(storageId, folderPathname)
        const depth = nameElements.length
        const folded = folderSetWithSubFolders.has(folderPathname)
          ? !sideNavOpenedItemSet.has(itemId)
          : undefined

        const folderIsActive =
          currentPathnameWithoutNoteId ===
          `/m/storages/${storageId}/notes${folderPathname}`
        return (
          <NavigatorItem
            key={itemId}
            folded={folded}
            depth={depth}
            active={folderIsActive}
            icon={folderIsActive ? <IconFileOpen size='1.3em' /> : <IconFile />}
            label={folderName}
            onClick={createOnFolderItemClickHandler(folderPathname)}
            onDoubleClick={() => showPromptToRenameFolder(folderPathname)}
            onContextMenu={createOnContextMenuHandler(
              storage.id,
              folderPathname
            )}
            onFoldButtonClick={() => toggleSideNavOpenedItem(itemId)}
            controlComponents={[
              <ControlButton
                key='addFolderButton'
                onClick={() => showPromptToCreateFolder(folderPathname)}
                icon={<IconAddRound />}
              />,
            ]}
          />
        )
      })}
    </>
  )
}

function getFolderNameElementTree(folderPathnameList: string[]) {
  return folderPathnameList.reduce((tree, folderPathname) => {
    const nameElements = folderPathname.slice(1).split('/')

    let targetTree = tree
    for (const nameElement of nameElements) {
      if (targetTree[nameElement] == null) {
        targetTree[nameElement] = {}
      }
      targetTree = targetTree[nameElement]
    }

    return tree
  }, {})
}

function getOpenedFolderPathnameList(
  tree: {},
  storageId: string,
  openItemIdSet: Set<string>,
  parentPathname: string
) {
  const names = Object.keys(tree)
  const pathnameList: string[] = []
  for (const name of names) {
    const pathname =
      parentPathname === '/' ? `/${name}` : `${parentPathname}/${name}`
    if (pathname === '/') {
      continue
    }
    pathnameList.push(pathname)
    if (openItemIdSet.has(getFolderItemId(storageId, pathname))) {
      pathnameList.push(
        ...getOpenedFolderPathnameList(
          tree[name],
          storageId,
          openItemIdSet,
          pathname
        )
      )
    }
  }
  return pathnameList
}

export default FolderListFragment
