// Adapted from shadcn/ui toast implementation
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 10
const TOAST_REMOVE_DELAY = 1000000

export interface ToasterToast extends Omit<ToastProps, "title" | "description"> {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        const timeoutId = setTimeout(() => {
          toastTimeouts.delete(toastId);
        }, TOAST_REMOVE_DELAY);
        toastTimeouts.set(toastId, timeoutId);
      } else {
        state.toasts.forEach((toast) => {
          const timeoutId = setTimeout(() => {
            toastTimeouts.delete(toast.id);
          }, TOAST_REMOVE_DELAY);
          toastTimeouts.set(toast.id, timeoutId);
        });
      }

      if (toastId) {
        const timeoutId = toastTimeouts.get(toastId);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        toastTimeouts.delete(toastId);
      } else {
        state.toasts.forEach((toast) => {
          const timeoutId = toastTimeouts.get(toast.id);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          toastTimeouts.delete(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          toastId !== undefined && t.id === toastId
            ? {
                ...t,
              }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type ToastOptions = Partial<
  Pick<ToasterToast, "action" | "variant">
> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export function toast({
  title,
  description,
  variant,
  ...props
}: ToastOptions) {
  const id = genId()

  const update = (props: Partial<ToasterToast>) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      id,
      title,
      description,
      variant,
      ...props,
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

interface UseToastReturn {
  toast: typeof toast
  dismiss: (toastId?: string) => void
  toasts: ToasterToast[]
}

export function useToast(): UseToastReturn {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
    toasts: state.toasts,
  }
}
