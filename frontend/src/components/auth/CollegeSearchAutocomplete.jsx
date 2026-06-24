import { useState, useEffect, useRef } from "react"
import { searchColleges } from "../../api/college.api"

/**
 * Debounced college search-as-you-type with a dropdown of results.
 * Controlled component: the parent owns `selected`, this component only
 * reports selection changes via `onSelect`.
 *
 * Props:
 *   - selected: the currently selected college object (or null)
 *   - onSelect: (college | null) => void — called when user picks a result,
 *               or clears the field (passes null)
 *   - placeholder: input placeholder text
 *   - emptyStateMessage: shown when a search returns zero results
 *   - label: optional <label> text rendered above the input
 */
const CollegeSearchAutocomplete = ({
  selected,
  onSelect,
  placeholder = "Search your college",
  emptyStateMessage = "No colleges found. Try a different search.",
  label,
}) => {
  const [query, setQuery] = useState(selected?.name || "")
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const wrapperRef = useRef(null)

  // Debounced search — clears stale results immediately on every keystroke,
  // so the dropdown never shows results from a previous query while waiting.
  useEffect(() => {
    setResults([])

    if (query.trim() === "" || selected) {
      setSearching(false)
      return
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const response = await searchColleges(query)
        setResults(response.data.colleges)
        setShowDropdown(true)
      } catch (err) {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query, selected])

  // Close dropdown when clicking anywhere outside this component
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleChange = (e) => {
    setQuery(e.target.value)
    if (selected) onSelect(null) // typing again clears a prior selection
  }

  const handleSelect = (college) => {
    onSelect(college)
    setQuery(college.name)
    setShowDropdown(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="text-sm font-medium text-foreground block mb-1">
          {label}
        </label>
      )}

      <input
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 w-full bg-card border border-border rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
          {results.map((college) => (
            <div
              key={college._id}
              onClick={() => handleSelect(college)}
              className="px-3 py-2 text-sm hover:bg-secondary cursor-pointer"
            >
              <p className="font-medium text-foreground">{college.name}</p>
              <p className="text-muted-foreground text-xs">
                {college.city}, {college.state}
              </p>
            </div>
          ))}
        </div>
      )}

      {!searching && query.trim() !== "" && results.length === 0 && !selected && (
        <p className="text-xs text-muted-foreground mt-1">{emptyStateMessage}</p>
      )}
    </div>
  )
}

export default CollegeSearchAutocomplete