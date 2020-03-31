import React from 'react'
import styled from '../../../lib/styled'
import {
  borderBottom,
  uiTextColor,
  sideBarBackgroundColor,
} from '../../../lib/styled/styleFunctions'
import Icon from './Icon'

const TableViewCellContainerButton = styled.button`
  height: 44px;
  width: 100%;
  border: none;
  padding: 0 1em;
  display: flex;
  text-align: left;
  font-size: 15px;
  ${uiTextColor}
  ${sideBarBackgroundColor}
  ${borderBottom}
`

const TableViewCellTitle = styled.div`
  flex: 1;
`

interface TableViewCellProps {
  iconPath?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

const TableViewCell: React.FC<TableViewCellProps> = ({
  children,
  iconPath,
  onClick,
}) => {
  return (
    <TableViewCellContainerButton onClick={onClick}>
      <TableViewCellTitle>{children}</TableViewCellTitle>
      {iconPath != null && <Icon path={iconPath} />}
    </TableViewCellContainerButton>
  )
}

export default TableViewCell
