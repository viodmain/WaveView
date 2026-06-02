declare module 'react-split-pane' {
  import * as React from 'react';

  export type Size = string | number;

  export interface Props {
    allowResize?: boolean;
    className?: string;
    primary?: 'first' | 'second';
    minSize?: Size;
    maxSize?: Size;
    defaultSize?: Size;
    size?: Size;
    split?: 'vertical' | 'horizontal';
    onDragStarted?: () => void;
    onDragFinished?: () => void;
    onChange?: (newSize: number) => void;
    onResizerClick?: (event: MouseEvent) => void;
    onResizerDoubleClick?: (event: MouseEvent) => void;
    style?: React.CSSProperties;
    resizerStyle?: React.CSSProperties;
    paneStyle?: React.CSSProperties;
    pane1Style?: React.CSSProperties;
    pane2Style?: React.CSSProperties;
    resizerClassName?: string;
    step?: number;
    children?: React.ReactNode;
  }

  export default class SplitPane extends React.Component<Props> {}
}
