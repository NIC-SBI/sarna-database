-- Keep links non-functional when their central configuration value is empty or
-- still set to a placeholder in _variables.yml.

local function text_of(value)
  if value == nil then
    return ""
  end
  return pandoc.utils.stringify(value)
end

local variables = nil

local function load_variables()
  if variables ~= nil then
    return variables
  end

  variables = {}
  local file = io.open("_variables.yml", "r")
  if file == nil then
    return variables
  end

  for line in file:lines() do
    local key, value = line:match("^%s*([%w%-]+):%s*(.-)%s*$")
    if key ~= nil then
      value = value:gsub("^['\"]", ""):gsub("['\"]$", "")
      variables[key] = value
    end
  end

  file:close()
  return variables
end

local function configured(key, placeholder)
  local value = load_variables()[key]
  return value ~= nil and value ~= "" and value ~= placeholder
end

function Link(element)
  local target = text_of(element.target)

  if target == "mailto:" or
      target:find("{{< var project-email", 1, true) then
    if not configured("project-email", "PROJECT_EMAIL_PLACEHOLDER") then
      return pandoc.Str("Project contact details will be added before the first public database release.")
    end
    return element
  end

  if target:find("{{< var github-organization", 1, true) or
      target:find("{{< var repository-name", 1, true) then
    if not configured("github-organization", "GITHUB_ORG_PLACEHOLDER") or
        not configured("repository-name", "REPOSITORY_NAME_PLACEHOLDER") then
      return pandoc.Str("Project repository details will be added before the first public database release.")
    end
  end

  return element
end
