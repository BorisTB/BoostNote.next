import React, { useState } from 'react'
import {
  FormGroup,
  FormLabel,
  FormPrimaryButton,
  FormTextInput
} from '../atoms/form'
import { useTranslation } from 'react-i18next'
import { useRouter } from '../../lib/router'
import { useDb } from '../../lib/db'
import { useToast } from '../../lib/toast'

const LocalStorageCreateForm = () => {
  const [name, setName] = useState('')
  const { t } = useTranslation()
  const { push } = useRouter()
  const db = useDb()
  const { pushMessage } = useToast()
  const createStorageCallback = async () => {
    try {
      const storage = await db.createStorage(name, 'local')
      push(`/app/storages/${storage.id}/notes`)
    } catch {
      pushMessage({
        title: 'Cloud Error',
        description:
          'An error occured while attempting to create a cloud storage'
      })
    }
  }
  return (
    <>
      <FormGroup>
        <FormLabel>{t('storage.name')}</FormLabel>
        <FormTextInput
          type='text'
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
        />
      </FormGroup>
      <FormGroup>
        <FormPrimaryButton onClick={createStorageCallback}>
          Create Storage
        </FormPrimaryButton>
      </FormGroup>
    </>
  )
}

export default LocalStorageCreateForm
